/*
   @source: https://github.com/kleintom/Pheasant-Branch-Conservancy-fauna
   @licstart  The following is the entire license notice for the JavaScript
   code in this page.

   Copyright (C) 2013 Tom Klein

   The JavaScript code in this page is free software: you can
   redistribute it and/or modify it under the terms of the GNU
   General Public License (GNU GPL) as published by the Free Software
   Foundation, either version 3 of the License, or (at your option)
   any later version.  The code is distributed WITHOUT ANY WARRANTY;
   without even the implied warranty of MERCHANTABILITY or FITNESS
   FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

   As additional permission under GNU GPL version 3 section 7, you
   may distribute non-source (e.g., minimized or compacted) forms of
   that code without the copy of the GNU GPL normally required by
   section 4, provided you include this license notice and a URL
   through which recipients can access the Corresponding Source.

   @licend  The above is the entire license notice for the JavaScript code in
   this page.
*/
var fauna = {};

// Display the <data> for <category> in thumbnail format.
fauna.displayThumbCategory = function(category, data) {

  // Sort by common name, except put empty names at the end.
  var sortFunction = function(a, b) {

    if (a.nonDNRAnimal && !b.nonDNRAnimal) {
      return -1;
    }
    else if (!a.nonDNRAnimal && b.nonDNRAnimal) {
      return 1;
    }

    if (a.images && !b.images) {
      return -1;
    }
    else if (!a.images && b.images) {
      return 1;
    }

    if (a.common === '' && b.common === '') {
      return a.scientific < b.scientific ? 1 : -1;
    }
    else if (b.common === '') {
      return -1;
    }

    if (a.common === '') {
      return 1;
    }

    return b.common < a.common ? 1 : -1;
  }
  data = data.sort(sortFunction);
  fauna.thumbCategoryData[category] = data; // Save for use by detail requests.
  fauna.currentCategory = category;

  var faunaDiv = document.getElementById("thumbFauna");
  faunaDiv.innerHTML = "";
  var thumbsFragment = document.createDocumentFragment();
  for (var i = 0; i < data.length; ++i) { // For each animal.

    var thisAnimal = data[i];
    var thumbsDiv = document.createElement('div');
    thumbsDiv.setAttribute('class', 'thumbs');
    thumbsDiv.setAttribute('id', thisAnimal.id);
    thumbsDiv.onclick = fauna.createDetailClickHandler(i);
    var tipDiv = document.createElement('div');
    if (!thisAnimal.nonDNRAnimal || thisAnimal.images === '') {
      // Special category; make the tooltip always visible.
      tipDiv.setAttribute('class', 'nameTipOn');
      fauna.createThumbTip(thisAnimal.common, thisAnimal.scientific,
                           tipDiv, false, !thisAnimal.nonDNRAnimal);
      thumbsDiv.style.width = "200px";
      // No images.
    }
    else {
      tipDiv.setAttribute('class', 'nameTip');
      tipDiv.setAttribute('id', thisAnimal.id + 'nameTip');
      thumbsDiv.onmouseover = fauna.createThumbTip(thisAnimal.common,
                                                   thisAnimal.scientific,
                                                   tipDiv, true, false);
      thumbsDiv.onmouseout = fauna.cancelThumbTip(tipDiv);
      // Images.
      var images = fauna.splitCSVList(thisAnimal.images);
      for (var j = 0; j < images.length; ++j) {
        var thumbContainer = document.createElement('div');
        thumbContainer.setAttribute('class', 'thumbContainer');
        var imageElt = document.createElement('img');
        imageElt.setAttribute('src', 'images/z' + images[j] + '.jpg');
        thumbContainer.appendChild(imageElt);
        thumbsDiv.appendChild(thumbContainer);
      }
    }
    thumbsDiv.appendChild(tipDiv);
    thumbsFragment.appendChild(thumbsDiv);
  }
  faunaDiv.appendChild(thumbsFragment);
  fauna.thumbCategoryHTML[category] = faunaDiv.innerHTML;
  fauna.scrollToId("instructions");
};

// Populate <tipDiv> with <common> and <scientific> display text; if
// <returnDisplayer> is true then return a function that schedules
// display of the tip, otherwise make the tip permanently visible.
fauna.createThumbTip = function(common, scientific, tipDiv,
                                returnDisplayer, displayDNRNote) {

  var displayText = "";

  if (displayDNRNote) {
    displayText = "<strong>WI DNR Prairie Insect Survey:</strong> ";
  }
  if (common !== "" && scientific !== "") {
    displayText += common + " - " + '<i>' + scientific + '</i>';
  }
  else if (common !== "") {
    displayText += common;
  }
  else if (scientific !== "") {
    displayText += '<i>' + scientific + '</i>';
  }
  tipDiv.innerHTML = displayText;
  if (returnDisplayer) {
    return fauna.createTipDisplayFunction(tipDiv);
  }
};

fauna.createTipDisplayFunction = function(tipDiv) {

  return function() {
    if (fauna.thumbTimerId === 0) {
      var displayFunc = function() {tipDiv.style.visibility = "visible";};
      fauna.thumbTimerId = setTimeout(displayFunc, 500);
    }
  };
};

// Return a function that cancels display of the tool tip in <tipDiv>.
fauna.cancelThumbTip = function(tipDiv) {

  return function() {
    if (fauna.thumbTimerId != 0) {
      clearTimeout(fauna.thumbTimerId);
      fauna.thumbTimerId = 0;
      tipDiv.style.visibility = "hidden";
    }
  };
};

// Reassigning saved innerHTML doesn't remember click handlers, so
// reassign them.
fauna.renewClickHandlers = function() {

  if (fauna.getViewType() === 'thumb') {
    var data = fauna.thumbCategoryData[fauna.currentCategory];
    for (var i = 0; i < data.length; ++i) { // For each animal.
      var thisAnimal = data[i];
      var thumbsDiv = document.getElementById(thisAnimal.id);
      thumbsDiv.onclick = fauna.createDetailClickHandler(i);
      // Renew the tip handlers (DNR animals have their tips permanently
      // visible, so we can skip those).
      if (thisAnimal.nonDNRAnimal) {
        var thisId = thisAnimal.id;
        var thumbsDiv = document.getElementById(thisId);
        var tipDiv = document.getElementById(thisId + 'nameTip');
        thumbsDiv.onmouseover = fauna.createTipDisplayFunction(tipDiv);
        thumbsDiv.onmouseout = fauna.cancelThumbTip(tipDiv);
      }
    }
  }
  else { // Tree view.
    var data = fauna.treeCategoryData[fauna.currentCategory];
    for (var i = 0; i < data.length; ++i) { // For each animal.
      var thisAnimal = data[i];
      var thumbsDiv = document.getElementById('th' + i);
      thumbsDiv.onclick = fauna.createTreeThumbsClickHandler(i);
    }
  }
};

fauna.categoryLength = function() {

  return fauna.thumbCategoryData[fauna.currentCategory].length;
}

// Update the detail controls based on the current detail index.
fauna.updateDetailControls = function() {

  var curIndex = fauna.curDetailIndex(); // 0-based.
  var maxIndex = fauna.categoryLength() - 1;
  // Detail can change from any one index to any other, so need to
  // check all cases each time.
  if (curIndex === 0) {
    var left = document.getElementById('detailLeft');
    left.style.cursor = "default";
    // Do I need to set size again, even though it's the same as the
    // previous src?  Probably...
    left.src = "images/leftOff.png";
    var fullLeft = document.getElementById('detailFullLeft');
    fullLeft.style.cursor = "default";
    fullLeft.src = "images/fullLeftOff.png";
    var right = document.getElementById('detailRight');
    right.style.cursor = "pointer";
    right.src = "images/right.png";
    var fullRight = document.getElementById('detailFullRight');
    fullRight.style.cursor = "pointer";
    fullRight.src = "images/fullRight.png";
  }
  else if (curIndex === maxIndex) {
    var left = document.getElementById('detailLeft');
    left.style.cursor = "pointer";
    left.src = "images/left.png";
    var fullLeft = document.getElementById('detailFullLeft');
    fullLeft.style.cursor = "pointer";
    fullLeft.src = "images/fullLeft.png";
    var right = document.getElementById('detailRight');
    right.style.cursor = "default";
    right.src = "images/rightOff.png";
    var fullRight = document.getElementById('detailFullRight');
    fullRight.style.cursor = "default";
    fullRight.src = "images/fullRightOff.png";
  }
  else {
    var left = document.getElementById('detailLeft');
    left.style.cursor = "pointer";
    left.src = "images/left.png";
    var fullLeft = document.getElementById('detailFullLeft');
    fullLeft.style.cursor = "pointer";
    fullLeft.src = "images/fullLeft.png";
    var right = document.getElementById('detailRight');
    right.style.cursor = "pointer";
    right.src = "images/right.png";
    var fullRight = document.getElementById('detailFullRight');
    fullRight.style.cursor = "pointer";
    fullRight.src = "images/fullRight.png";
  }
};

// Input is the (0-based!) index of the animal in the current category
// to create the detail for.
fauna.createDetailClickHandler = function(i) {

  return function() {
    fauna.loadDetailAnimal(i);
    fauna.updateDetailControls();
    fauna.setThumbsDetailVisible(true);
    fauna.preloadImages(i - 1);
    fauna.preloadImages(i + 1);
  };
};

// Load animal with (0-based!) <index> in the detail div, removing any
// previous animal.
fauna.loadDetailAnimal = function(index) {

  fauna.detailAnimal.innerHTML = "";
  var animal = fauna.thumbCategoryData[fauna.currentCategory][index];
  fauna.detailAnimal.appendChild(fauna.createAnimalDetailDiv(animal));
  fauna.setDisplayedIndex(index + 1);
};

// Input is the (0-based!) index of the animal in the current category
// to create the detail for.
fauna.createTreeThumbsClickHandler = function(i) {

  return function() {
    fauna.loadTreeDetailAnimal(i);
    fauna.setTreeDetailVisible(true);
  };
};

// Load animal with (0-based!) <index> in the tree detail div, removing any
// previous animal.
fauna.loadTreeDetailAnimal = function(index) {

  var animal = fauna.treeCategoryData[fauna.currentCategory][index];
  fauna.createTreeAnimalDetailDiv(animal);
};

// Display the (1-based!) <index> of the detail animal in the detail
// control bar.
fauna.setDisplayedIndex = function(index) {

  if (index < 1) { alert("index too low: " + index); index = 1; }
  var maxCount = fauna.categoryLength();
  if (index > maxCount) {
    alert("index too high: " + index);
    index = maxCount;
  }
  fauna.detailCount.innerHTML = index + "/" + maxCount;
};

// Return the current detail index (0-based!).
fauna.curDetailIndex = function() {

  var indexText = fauna.detailCount.innerHTML;
  return parseInt(indexText.substring(0, indexText.indexOf('/'))) - 1;
};

// Move the detail index as specified by <where>.
fauna.moveDetail = function(where) {

  var newIndex = 0; // 0-based.
  if (where === "fullLeft") {
    newIndex = 0;
    fauna.preloadImages(1);
  }
  else if (where === "left") {
    if (fauna.curDetailIndex() === 0) {
      return;
    }
    newIndex = fauna.curDetailIndex() - 1;
    fauna.preloadImages(newIndex - 1);
  }
  else if (where === "right") {
    if (fauna.curDetailIndex() === fauna.categoryLength() - 1) {
      return;
    }
    newIndex = fauna.curDetailIndex() + 1;
    fauna.preloadImages(newIndex + 1);
  }
  else if (where === "fullRight") {
    newIndex = fauna.categoryLength() - 1;
    fauna.preloadImages(newIndex - 1);
  }
  fauna.loadDetailAnimal(newIndex);
  fauna.updateDetailControls();
};

// Preload the images for the animal at (0-based!) index <index> in the current
// category.
fauna.preloadImages = function(index) {

  if (index < 0 || index >= fauna.categoryLength()) {
    return;
  }
  var animal = fauna.thumbCategoryData[fauna.currentCategory][index];
  var images = fauna.splitCSVList(animal.images);
  // There's some indication online that individual img objects are
  // necessary to actually preload multiple images.
  var imageRefs = [];
  for (var i = 0; i < images.length; ++i) {
    imageRefs[i] = new Image();
    imageRefs[i].src = 'images/' + images[i] + '.jpg';
  }
};

// Make the detail div visible if <visible> is true, else hide it.
fauna.setThumbsDetailVisible = function(visible) {

  fauna.setDetailVisibilityOnDiv(fauna.thumbsDetailDiv, visible);
  // Make sure the thumb tool tip is hidden either way.
  fauna.cancelThumbTip();
};

// Make the tree detail div visible if <visible> is true, else hide it.
fauna.setTreeDetailVisible = function(visible) {

  fauna.setDetailVisibilityOnDiv(fauna.treeDetailDiv, visible);
};

fauna.setDetailVisibilityOnDiv = function(detailDiv, visible) {

  if (visible) {
    // Disable scrolling on main window.
    // NOTE that keyboard scrolling is still active.
    document.body.style.overflowY= 'hidden';
    var windowWidth = fauna.windowWidth();
    var topOffset = 8;
    var heightOffset = -28;
    detailDiv.style.top = fauna.pageYOffset() + topOffset + "px";
    detailDiv.style.height = fauna.windowHeight() + heightOffset + "px";
    fauna.screenDiv.style.visibility = 'visible';
    detailDiv.style.visibility = 'visible';
  }
  else {
    fauna.screenDiv.style.visibility = 'hidden';
    detailDiv.style.visibility = 'hidden';
    // Enable scrolling on main window.
    document.body.style.overflowY= 'visible';
  }
};

// Given <animal> data, return a div displaying the animal's info.
fauna.createAnimalDetailDiv = function(animal) {

  var animalDiv = document.createElement('div');
  animalDiv.setAttribute('class', 'animal');

  // Title.
  var titleDiv = document.createElement('div');
  titleDiv.setAttribute('class', 'title');
  var scientific =
    animal.scientific ? ' (<i>' + animal.scientific + '</i>)' : '';
  titleDiv.innerHTML = '<b>' + animal.common + scientific + '</b>';
  animalDiv.appendChild(titleDiv);

  // Taxonomy.
  if (animal.taxonomy) {
    var taxonomy = [];
    var taxons = animal.taxonomy.split('!');
    for (var i = 0; i < taxons.length; ++i) {
      var thisTaxon = taxons[i];
      var parts = thisTaxon.split('@');
      var taxonTitle = parts[0];
      var taxonName = parts[1];
      if (taxonTitle == 'nt') {
        // Some of the 'n'o 't'axon strings have "s; when we try to
        // put them in attribute fields of xml tags for storage, php
        // converts them to \&quot; - note the \!  Unexpected (it
        // doesn't do the same with & -> &amp; or < -> &lt; etc.)
        // Anyway, we (magically) receive it from php as \", so just
        // remove the stupid \...  This issue will probably spread at
        // some point.  Yuk.
        taxonName = taxonName.replace(/\\/g, '');
      }
      taxonomy.push([taxonTitle, taxonName]);
    }
    fauna.addClassification(animalDiv, taxonomy);
  }

  // History.
  if (animal.history) {
    animalDiv.appendChild(fauna.createNotesElement('Life history and ecology',
                                                   animal.history));
  }
  // Id info.
  if (animal.identification) {
    animalDiv.appendChild(fauna.createNotesElement('Identification Notes',
                                                   animal.identification));
  }
  // Links.
  if (animal.links) {
    animalDiv.appendChild(fauna.createNotesElement('Links',
                                                   animal.links,
                                                   'detailLinks'));
  }

  // Images.
  if (animal.nonDNRAnimal && animal.images.length) {
    var imagesDiv = document.createElement('div');
    imagesDiv.setAttribute('class', 'detailImages');
    var images = fauna.splitCSVList(animal.images);
    for (var j = 0; j < images.length; ++j) {
      var imageElt = document.createElement('img');
      imageElt.setAttribute('src', 'images/' + images[j] + '.jpg');
      imagesDiv.appendChild(imageElt);
    }
    animalDiv.appendChild(imagesDiv);
  }
  return animalDiv;
};

// Fill in the treeDetailDiv with this animal's info.
fauna.createTreeAnimalDetailDiv = function(animal) {

  // Title.
  fauna.treeDetailTitle.innerHTML = '<b><i>' + animal.scientific +
    '</i> -- ' + animal.common + '</b>';

  // Images.
  if (animal.nonDNRAnimal) {
    fauna.treeDetailImages.innerHTML = '';
    var images = fauna.splitCSVList(animal.images);
    for (var i = 0; i < images.length; ++i) {
      var imageElt = document.createElement('img');
      imageElt.setAttribute('src', 'images/' + images[i] + '.jpg');
      fauna.treeDetailImages.appendChild(imageElt);
    }
  }
};

fauna.taxonTitles = {};
fauna.taxonTitles['c'] = "Class";
fauna.taxonTitles['sc'] = "Subclass";
fauna.taxonTitles['uo'] = "Superorder";
fauna.taxonTitles['o'] = "Order";
fauna.taxonTitles['io'] = "Infraorder";
fauna.taxonTitles['so'] = "Suborder";
fauna.taxonTitles['uf'] = "Superfamily";
fauna.taxonTitles['f'] = "Family";
fauna.taxonTitles['sf'] = "Subfamily";
fauna.taxonTitles['ut'] = "Supertribe";
fauna.taxonTitles['t'] = "Tribe";
fauna.taxonTitles['st'] = "Subtribe";
fauna.taxonTitles['g'] = "Genus";
fauna.taxonTitles['sg'] = "Subgenus";
fauna.taxonTitles['s'] = "Species";
fauna.taxonTitles['ss'] = "Subspecies";
fauna.taxonTitles['nt'] = "No Taxon";

// Append data from taxonomyList to parentElement.
fauna.addClassification = function(parentElement, taxonomyList) {

  var container = document.createElement('div');
  var titleDiv = document.createElement('div');
  titleDiv.setAttribute('class', 'notesTitle');
  titleDiv.appendChild(document.createTextNode('Classification'));
  container.appendChild(titleDiv);
  // Do what bugguide does (css-wise).
  var taxDiv = document.createElement('div');
  taxDiv.setAttribute('class', 'classification');
  var parentDiv = taxDiv;
  var genus = ''; // Remember genus when species comes around.
  var species = ''; // Remember species when subspecies comes around.
  for (var i = 0; i < taxonomyList.length; ++i) {
    var taxonTitle = taxonomyList[i][0];
    var taxonName = taxonomyList[i][1];

    var thisTaxonDiv = document.createElement('div');
    thisTaxonDiv.setAttribute('class', 'taxon');

    var titleSpan = document.createElement('span');
    titleSpan.setAttribute('class', 'taxonTitle');
    titleSpan.appendChild(document.createTextNode(fauna.taxonTitles[taxonTitle] + ' '));
    thisTaxonDiv.appendChild(titleSpan);

    var nameSpan = document.createElement('span');
    if (taxonTitle == 'g') { // Genus.
      genus = taxonName;
      var italics = document.createElement('i');
      italics.appendChild(document.createTextNode(taxonName));
      nameSpan.appendChild(italics);
    }
    else if (taxonTitle == 's') { // Species.
      species = taxonName;
      var italics = document.createElement('i');
      italics.appendChild(document.createTextNode(taxonName));
      nameSpan.appendChild(italics);
      var fullName = ' (' + genus + ' ' + taxonName + ')';
      nameSpan.appendChild(document.createTextNode(fullName));
    }
    else if (taxonTitle == 'ss') { // Subspecies.
      var italics = document.createElement('i');
      italics.appendChild(document.createTextNode(taxonName));
      nameSpan.appendChild(italics);
      var fullName = ' (' + genus + ' ' + species + ' ' + taxonName + ')';
      nameSpan.appendChild(document.createTextNode(fullName));
    }
    else {
      nameSpan.appendChild(document.createTextNode(taxonName));
    }
    thisTaxonDiv.appendChild(nameSpan);

    parentDiv.appendChild(thisTaxonDiv);
    parentDiv = thisTaxonDiv;
  }
  container.appendChild(taxDiv);
  parentElement.appendChild(container);
};

// Create a div to display <notesText> in a paragraph with a title
// <notesTitle>.
fauna.createNotesElement = function(notesTitle, notesText, notesClass) {

  var notesDiv = document.createElement('div');
  if (notesClass) {
    notesDiv.setAttribute('class', notesClass);
  }
  var titleDiv = document.createElement('div');
  titleDiv.setAttribute('class', 'notesTitle');
  titleDiv.appendChild(document.createTextNode(notesTitle));
  notesDiv.appendChild(titleDiv);
  var notesParagraph = document.createElement('p');
  notesDiv.appendChild(notesParagraph);
  notesText = notesText.replace(/&quot;/g, '"');
  // Replace \n with <br />.
  var lines = notesText.split("\n");
  for (var i = 0; i < lines.length - 1; ++i) {
    fauna.createLinks(lines[i], notesParagraph);
    notesParagraph.appendChild(document.createElement('br'));
  }
  fauna.createLinks(lines[lines.length - 1], notesParagraph);
  return notesDiv;
};

fauna.displayInstructions = function(visibile) {

  var value = 'block';
  if (!visibile) { value = 'none'; }
  document.getElementById('instructions').style.display = value;
};

fauna.getSelectCount = function() {
  var count = 0;
  var getSelectCount = function() {
    var returnCount = count;
    ++count;
    return count;
  };
  return getSelectCount;
}();

fauna.createSelect = function() {

  var form = document.createElement('form');
  form.setAttribute('class', 'selectForm');
  var selectCount = fauna.getSelectCount();
  form.setAttribute('name', 'selectForm' + selectCount);
  var select = document.createElement('select');
  var selectId = 'select' + selectCount;
  select.setAttribute('name', selectId);
  select.setAttribute('id', selectId);
  var firstOption = document.createElement('option');
  firstOption.setAttribute('value', '');
  firstOption.appendChild(document.createTextNode('Select a fauna category'));
  select.appendChild(firstOption);
  for (var i = 0; i < fauna.categories.length; ++i) {
    var thisCategory = fauna.categories[i];
    var option = document.createElement('option');
    option.setAttribute('value', thisCategory.id);
    option.appendChild(document.createTextNode(thisCategory.title));
    select.appendChild(option);
  }
  fauna.updateEventHandler('change', select, fauna.selectChanged(select));
  form.appendChild(select);
  return form;
};

fauna.loadCurrentCategory = function() {

  var category = fauna.currentCategory;
  document.getElementById("faunaTitle").innerHTML =
    fauna.getCategoryTitle(category);
  if (fauna.getViewType() === 'thumb') {
    fauna.loadCurrentCategoryHelper('thumbFauna', true, category,
                                    fauna.thumbCategoryHTML[category],
                                    'instructions');
  }
  else { // Tree view.
    fauna.loadCurrentCategoryHelper('treeFauna', false, category,
                                    fauna.treeCategoryHTML[category],
                                    'treeViewBox');
  }
};

fauna.loadCurrentCategoryHelper = function(faunaDivId,
                                           maybeDisplayInstructions,
                                           category,
                                           categoryHTML,
                                           idToScrollTo) {

  var faunaDiv = document.getElementById(faunaDivId);
  faunaDiv.innerHTML = "";
  fauna.displayInstructions(maybeDisplayInstructions);
  if (categoryHTML) {
    faunaDiv.innerHTML = categoryHTML;
    fauna.renewClickHandlers();
    fauna.removeLoading();
    fauna.scrollToId(idToScrollTo);
  }
  else {
    fauna.loadCategory(category);
  }
};

// Apparently need to use a closure here since IE doesn't set "this" on
// event handlers.
fauna.selectChanged = function(select) {

  return function() {
    //var select = this;
    var form = select.form;
    var category = select.value;
    select.selectedIndex = 0;
    if (category === fauna.currentCategory || category === '') {
      return;
    }
    fauna.currentCategory = category;
    fauna.setVisible();
    fauna.loadCurrentCategory();
    document.getElementById('select1').blur();
    document.getElementById('select2').blur();
  };
};

fauna.setVisible = function() {

  document.getElementById("faunaDiv").style.display = "block";
  // Now never do this again.
  fauna.setVisible = function() {};
};

// Input is the string the browser provides for a style position property.
// Return the position in px if the input was in px, othwerwise (either already
// 0 or bad news) return 0.
fauna.getPositionFromStyle = function(positionString) {

  if (positionString == "" ||
      positionString.substring(positionString.length - 2) != "px") {
    return 0;
  }
  else {
    return parseInt(positionString.substring(0, positionString.length - 2));
  }
};

// "React" to a mouse down click on one of the detail control "button"s.
// TODO: This is buggy: if you click down here, but then click up off this image
// then we never do the click up reset.  On touchscreen if you long click here
// then we do the click down but never get the click up.
fauna.detailClickDown = function(id) {

  if (fauna.ignoreDetailClick(id)) {
    return;
  }
  var element = document.getElementById(id);
  var curTop = fauna.getPositionFromStyle(element.style.top);
  element.style.top = (curTop + 1) + "px";
};

fauna.detailClickUp = function(id) {

  if (fauna.ignoreDetailClick(id)) {
    return;
  }
  var element = document.getElementById(id);
  var curTop = fauna.getPositionFromStyle(element.style.top);
  element.style.top = (curTop - 1) + "px";
};

fauna.ignoreDetailClick = function(id) {

  if (fauna.getViewType() === 'tree') { return false; } // Don't ignore.

  if (fauna.curDetailIndex() === 0 &&
      (id === "detailLeft" || id === "detailFullLeft")) {
    return true;
  }
  if (fauna.curDetailIndex() === fauna.categoryLength() - 1 &&
      (id === "detailRight" || id === "detailFullRight")) {
    return true;
  }
  return false;
};

fauna.getCategoryTitle = function(category) {

  for (var i = 0; i < fauna.categories.length; ++i) {
    if (fauna.categories[i].id === category) {
      return fauna.categories[i].title;
    }
  }
  return '';
};

fauna.createLinks = function(text, element) {

  // Replace http://'s with links.
  var parts = text.split(/(http[s]?:[^ )]+|<a href="[^"]+">[^<]+<\/a>)/);
  for (var i = 0; i < parts.length; i = i + 2) {
    var text = parts[i];
    element.appendChild(document.createTextNode(text));
    if (i + 1 < parts.length) {
      var linkText = parts[i + 1];
      var href, hyperText;
      if (linkText.charAt(0) === 'h') { // http://...
        href = linkText;
        hyperText = linkText;
      }
      else { // Change '<a href...' markup into actual link.
        // linkText is of the form
        // <a href="plant1,plant2,...">text text...</a>
        // where the plant names are plant codes as used on the pbc_plant site.
        var results = linkText.match(/<a href="([^"]+)">(.+)</);
        href = 'http://pheasantbranch.org/flora/pbc_plant.php?plant=' + results[1];
        hyperText = results[2];
      }
      var link = document.createElement('a');
      link.setAttribute('href', href);
      link.appendChild(document.createTextNode(hyperText));
      element.appendChild(link);
    }
  }
};

fauna.getData = function(xml, elementName) {

  var element = xml.getElementsByTagName(elementName)[0];
  if (element && element.firstChild) {
    return element.firstChild.data;
  }
  else {
    return '';
  }
};

fauna.listSortOne = function(a, b) { return b[1] < a[1] ? 1 : -1; };
fauna.sortByScientific = function(a, b) {
  return b.scientific < a.scientific ? 1 : -1;
};


// nodeList is added to stack in reverse alpha order; parent is the
// html div parent for the nodes in nodeList.  Returns an ordered list
// of animal data objects for the nodes in nodeList that were actual
// animal entries (not just taxon entries).
fauna.addTaxaNodeListToStack = function(nodeList, stack, parent) {

  // Only taxa get added to the stack.
  var taxonArray = [];
  // Actual animal entries get returned separately.
  var animalsArray = [];
  var tagName = "";
  for (var i = 0; i < nodeList.length; ++i) {
    var thisItem = nodeList[i];
    var thisTagName = thisItem.tagName;
    if (thisTagName !== 'z') { // Taxon entry.
      var taxonName = thisItem.getAttribute('t');
      // (Note: it's not necessarily true that all non-<z> children have
      // the same tagName, so need to remember each one.)
      taxonArray.push([thisItem, taxonName, thisTagName]);
    }
    else { // Animal entry.
      animalsArray.push(fauna.loadAnimalFromXml(thisItem));
    }
  }
  taxonArray.sort(fauna.listSortOne);
  for (var i = taxonArray.length - 1; i >= 0; --i) {
    stack.push([parent, taxonArray[i]]);
  }

  if (animalsArray.length > 0) {
    animalsArray.sort(fauna.sortByScientific);
  }
  return animalsArray;
};

fauna.loadAnimalFromXml = function(xmlAnimal) {

  var animalObject = {};
  animalObject.common = fauna.getData(xmlAnimal, 'c');
  animalObject.images = fauna.getData(xmlAnimal, 'i');
  var firstImageNumber = parseInt(animalObject.images, 10);
  if (isNaN(firstImageNumber)) { // No images (or a bad list).
    animalObject.images = '';
    animalObject.nonDNRAnimal = true;
  }
  else if (firstImageNumber < fauna.imageCutoff) {
    animalObject.images = '';
    animalObject.nonDNRAnimal = false;
  }
  else {
    animalObject.nonDNRAnimal = true;
  }
  animalObject.id = fauna.getData(xmlAnimal, 'n');
  animalObject.scientific = fauna.getData(xmlAnimal, 'sc');
  animalObject.history = fauna.getData(xmlAnimal, 'h');
  animalObject.links = fauna.getData(xmlAnimal, 'l');
  animalObject.identification = fauna.getData(xmlAnimal, 'id');
  return animalObject;
};

fauna.lineStyles = {};
fauna.lineStyles['e'] = {'s' : 'evenSolid', 'd' : 'evenSoft' };
fauna.lineStyles['o'] = {'s' : 'oddSolid', 'd' : 'oddSoft' };

fauna.addTreeViewDiv = function(tagName, taxonName, parent) {

  var maybeSolid = 'd'; // 'd'otted
  var titleClass = '';
  if (tagName == 's' || tagName === 'g' || tagName === 'f' ||
      tagName === 'o' || tagName === 'c') {
    maybeSolid = 's';
    titleClass = 'solidTitle';
  }
  var newTaxon = document.createElement('div');
  newTaxon.setAttribute('class', fauna.lineStyles[parent.eo()][maybeSolid]);
  var titleDiv = document.createElement('div');
  var taxonTitle = fauna.taxonTitles[tagName];
  titleDiv.setAttribute('class', titleClass + ' ' + 'treeTaxonTitleDiv');
  var taxonTitleSpan = document.createElement('span');
  taxonTitleSpan.setAttribute('class', 'treeTaxonTitle');
  taxonTitleSpan.appendChild(document.createTextNode(taxonTitle));
  var taxonNameSpan = document.createElement('span');
  taxonNameSpan.setAttribute('class', 'treeTaxonDesc');
  taxonNameSpan.appendChild(document.createTextNode(' ' + taxonName));

  titleDiv.appendChild(taxonTitleSpan);
  titleDiv.appendChild(taxonNameSpan);
  newTaxon.appendChild(titleDiv);
  parent.obj().appendChild(newTaxon);
  return fauna.eoObject(newTaxon, parent.eo());
};

fauna.addTreeViewAnimalDivs = function(animals, parent) {

  var categoryData = fauna.treeCategoryData[fauna.currentCategory];
  for (var i = 0; i < animals.length; ++i) {
    var thisAnimal = animals[i];
    var animalDiv = document.createElement('div');
    animalDiv.setAttribute('class', 'treeAnimal');
    //// Title.
    var titleDiv = document.createElement('div');
    titleDiv.setAttribute('class', 'title');
    titleDiv.innerHTML = '<b><i>' + thisAnimal.scientific +
      '</i> -- ' + thisAnimal.common + '</b>';
    animalDiv.appendChild(titleDiv);
    //// Images.
    // The number of animals added to this category prior to this one
    // = future index of this animal in categoryData (see below).
    var animalCount = categoryData.length;
    if (thisAnimal.nonDNRAnimal && thisAnimal.images) {
      var thumbsDiv = document.createElement('div');
      thumbsDiv.setAttribute('class', 'treeThumbs');
      thumbsDiv.setAttribute('id', 'th' + animalCount);
      var images = fauna.splitCSVList(thisAnimal.images);
      for (var j = 0; j < images.length; ++j) {
        var thumbContainer = document.createElement('div');
        thumbContainer.setAttribute('class', 'thumbContainer');
        var imageElt = document.createElement('img');
        imageElt.setAttribute('src', 'images/z' + images[j] + '.jpg');
        thumbContainer.appendChild(imageElt);
        thumbsDiv.appendChild(thumbContainer);
      }
      animalDiv.appendChild(thumbsDiv);
      // Remember this animal for the next time this category is loaded.
      var shortAnimal = {};
      shortAnimal.id = thisAnimal.id;
      shortAnimal.images = thisAnimal.images;
      shortAnimal.common = thisAnimal.common;
      shortAnimal.scientific = thisAnimal.scientific;
      shortAnimal.nonDNRAnimal = thisAnimal.nonDNRAnimal;
      categoryData.push(shortAnimal);
      thumbsDiv.onclick = fauna.createTreeThumbsClickHandler(animalCount);
    }
    // History.
    if (thisAnimal.history) {
      animalDiv.appendChild(fauna.createNotesElement('Life history and ecology',
                                                     thisAnimal.history));
    }
    // Id info.
    if (thisAnimal.identification) {
      animalDiv.appendChild(fauna.createNotesElement('Identification Notes',
                                                     thisAnimal.identification));
    }
    // Links.
    if (thisAnimal.links) {
      animalDiv.appendChild(fauna.createNotesElement('Links',
                                                     thisAnimal.links));
    }
    parent.obj().appendChild(animalDiv);
  }
};

// Keeps track of an object and a choice of 'e'ven or 'o'dd.
fauna.eoObject = function(object, oldEo) {

  return {
    obj: function() { return object; },
    eo: function() { return oldEo === 'e' ? 'o' : 'e'; }
  };
};

fauna.loadTreeViewFromXml = function(dom) {

  var root = dom.documentElement;
  var classes = root.childNodes; // Taxonomy classes, not CS classes.
  var faunaDiv = document.getElementById("treeFauna");
  var parent = fauna.eoObject(faunaDiv, 'e');
  var stack = [];
  fauna.addTaxaNodeListToStack(classes, stack, parent);
  while (stack.length) {
    var thisTaxon = stack.pop();
    parent = thisTaxon[0];
    var tagName = thisTaxon[1][2];
    var taxonName = thisTaxon[1][1];
    if (tagName === 'nt') {
      // See note elsewhere on 'n'o 't'axon snafu concerning "s.
      taxonName = taxonName.replace(/\\/g, '');
    }
    var taxonXmlNode = thisTaxon[1][0];
    parent = fauna.addTreeViewDiv(tagName, taxonName, parent);
    var animalsAtThisTaxon =
      fauna.addTaxaNodeListToStack(taxonXmlNode.childNodes, stack, parent);
    fauna.addTreeViewAnimalDivs(animalsAtThisTaxon, parent);
  }
  fauna.treeCategoryHTML[fauna.currentCategory] = faunaDiv.innerHTML;
  fauna.scrollToId("treeViewBox");
};

fauna.getViewType = function() {

  return document.getElementById('treeViewBox').checked ? 'tree' : 'thumb';
};

fauna.createCookie = function(days) {

  var date = new Date();
  date.setTime(date.getTime() + days*24*60*60*1000);
  document.cookie = 'fView=tree; expires=' + date.toGMTString() +
    '; path=/fauna';
};

fauna.setupViewMode = function(mode) {

  var cookieDays = (mode === 'thumb') ? -1 : 365;
  fauna.createCookie(cookieDays);

  if (!fauna.currentCategory) { return; }

  if (mode === 'thumb') {
    // Hide the tree view.
    document.getElementById('treeFauna').innerHTML = '';
    fauna.loadCurrentCategory();
  }
  else {
    // Hide the thumb view.
    document.getElementById('thumbFauna').innerHTML = '';
    fauna.loadCurrentCategory();
  }
};

fauna.loadAnimalsFromXML = function(dom) {

  var root = dom.documentElement;
  // Get us started - parents are
  // [taxon node, full-taxonomy-to-that-node] pairs.
  curParents = [[root, ""]];
  animals = [];
  while (curParents.length > 0) {
    // Process the current nodes.
    var childNodes = [];
    for (var i = 0; i < curParents.length; ++i) {
      var thisNode = curParents[i][0];
      var taxonParent = curParents[i][1];
      var child = thisNode.firstChild;
      while (child) {
        if (child.nodeType == document.ELEMENT_NODE) {
          var tagName = child.tagName;
          if (tagName != 'z') { // Another taxon level.
            var taxonName = child.getAttribute('t');
            childNodes.push([child, taxonParent + tagName + '@' + taxonName + '!']);
          }
          else { // An animal.
            var animalObject = fauna.loadAnimalFromXml(child);
            // Remove the trailing ! on taxonParent.
            animalObject.taxonomy =
              taxonParent.substring(0, taxonParent.length - 1);
            animals.push(animalObject);
          }
        }
        child = child.nextSibling;
      }
    }
    curParents = childNodes;
  }
  return animals;
};

// Fill in a category using the data provided in the xml <request>.
fauna.ajaxCategoryHandler = function(request) {

  if (request.readyState === 4) {
    if (request.status === 200) {
      if (fauna.checkAjaxResponse(request) === -1) {
        return;
      }
      var dom = request.responseXML;
      var category = dom.documentElement.tagName;
      if (fauna.getViewType() === 'thumb') {
        animalsList = fauna.loadAnimalsFromXML(dom);
        fauna.displayThumbCategory(category, animalsList);
        fauna.displayInstructions(true);
      }
      else {
        fauna.loadTreeViewFromXml(dom);
      }
    }
  }
};

fauna.checkAjaxResponse = function(request) {

  var xml = request.responseXML;
  if (!xml || !xml.documentElement ||
      xml.documentElement.nodeName === 'parsererror') {
    fauna.error_alert("Ajax error: " + request.responseText.substr(0, 200));
    return -1;
  }
  //alert(request.responseText);
  var maybe_error = xml.getElementsByTagName('error');
  if (maybe_error[0]) {
    fauna.error_alert(maybe_error[0].firstChild.data);
    return -1;
  }
  return 0;
};

fauna.scrollToStaticSelect = function() {

  window.scrollTo(0, fauna.staticSelectHeight + 1);
};

fauna.loadCategory = function(category) {

  var request = fauna.ajaxObject();
  request.onreadystatechange = function() {
    if (request.readyState === 1) {
      //      closeup_div.style.display = "block";
      //	  fauna.set_loading("closeups_loading");
    }
    else if (request.readyState === 4) {
      fauna.removeLoading();
      fauna.ajaxCategoryHandler(request);
    }
  };
  request.open("GET", "pbc_fauna_ajax.php?category=" + category, true);
  request.send(null);
  fauna.setLoading();
};

fauna.setLoading = function() {

  var loadingElement = document.getElementById("faunaLoading");
  fauna.loadingTimerId = setInterval(fauna.loadingFunction(loadingElement), 200);
};

fauna.removeLoading = function() {

  clearInterval(fauna.loadingTimerId);
  document.getElementById("faunaLoading").innerHTML = '';
};

fauna.loadingFunction = function(element) {

  return function() {
    var old = element.innerHTML;

    if (old === '/') {
      cur = '&ndash;';
    }
    else if (old === '\\') {
      cur = '|';
    }
    else if (old === '|') {
      cur = '/';
    }
    else {
      cur = '\\';
    }
    element.innerHTML = cur;
  };
};

/* http://www.quirksmode.org/js/findpos.html */
fauna.heightOfElement = function(element) {

  var curtop = 0;
  if (element.offsetParent) {
    do {
      curtop += element.offsetTop;
    } while (element = element.offsetParent);
  }
  return curtop;
};

fauna.scrollToElement = function(element) {

  if (element) {
    window.scrollTo(0, fauna.heightOfElement(element) - 4);
  }
};

fauna.scrollToId = function(id) {

  var element = document.getElementById(id);
  if (element) {
    fauna.scrollToElement(element);
  }
};

fauna.categories = [{id: 'ants', title: 'Ants'},
                    {id: 'bees', title: 'Bees'},
                    {id: 'beetles', title: 'Beetles'},
                    {id: 'butterflies', title: 'Butterflies'},
                    {id: 'caterpillars', title: 'Caterpillars'},
                    {id: 'dragonflies', title: 'Dragonflies and damselflies'},
                    {id: 'flies', title: 'Flies'},
                    {id: 'galls', title: 'Galls, leaf mines, etc.'},
                    {id: 'grasshoppers', title: 'Grasshoppers, katydids, and crickets'},
                    {id: 'moths', title: 'Moths'},
                    {id: 'other', title: 'Other'},
                    //{id: 'recent', title: 'Recent (added in the last 60 days)'},
                    {id: 'snakes', title: 'Snakes, frogs, turtles and toads'},
                    {id: 'spiders', title: 'Spiders'},
                    {id: 'bugs', title: 'True bugs'},
                    {id: 'wasps', title: 'Wasps'}];

// We remember the innerHTML of categories that have already been loaded.
fauna.thumbCategoryHTML = {};
fauna.treeCategoryHTML = {};
// An array of animal data for each category.
fauna.thumbCategoryData = {};
fauna.treeCategoryData = {};
// Remember the current category (as a string).
fauna.currentCategory = "";
// Timer id for the thumb images "tool tip".
fauna.thumbTimerId = 0;
// As hack, we use low assigned image numbers to indicate that certain entries
// should be displayed as WDNR survey entries (which don't themselves come
// with images).
fauna.imageCutoff = 100;

window.onload = function() {

  fauna.loadingTimerId = -1; // Remember the timer id for the "loading" span.
  fauna.scrollIsHigh = true; // true if we're showing the static select.

  var staticSelect = fauna.createSelect();
  document.getElementById('staticHolder').appendChild(staticSelect);
  var fixedSelect = fauna.createSelect();
  document.getElementById('fixedHolder').appendChild(fixedSelect);

  var selectHeight = staticSelect.offsetHeight;
  var selectWidth = staticSelect.offsetWidth;
  document.selectForm1.style.left = selectWidth + "px";
  document.selectForm1.style.left = selectWidth + "px";

  var backgroundPadding = 20;
  var backgroundHeight = selectHeight + backgroundPadding;
  document.getElementById('staticBackground').style.height =
     backgroundHeight + "px";
  document.getElementById('fixedBackground').style.height =
     backgroundHeight + "px";
  document.selectForm1.style.top = (backgroundPadding/2) + "px";
  document.selectForm2.style.top = (backgroundPadding/2) + "px";

  var backgroundWidth = selectWidth + backgroundPadding;
  document.getElementById('staticBackground').style.width =
    backgroundWidth + "px";
  document.getElementById('fixedBackground').style.width =
    backgroundWidth + "px";
  document.selectForm1.style.left = (backgroundPadding/2) + "px";
  document.selectForm2.style.left = (backgroundPadding/2) + "px";

  fauna.staticSelect = document.getElementById('staticSelect');
  fauna.staticSelectHeight = fauna.heightOfElement(fauna.staticSelect);
  fauna.fixedSelect = document.getElementById('fixedSelect');

  fauna.thumbsDetailDiv = document.getElementById('thumbsDetailDiv');
  fauna.treeDetailDiv = document.getElementById('treeDetailDiv');
  fauna.treeDetailTitle = document.getElementById('treeDetailTitle');
  fauna.detailAnimal = document.getElementById('detailAnimal');
  fauna.treeDetailImages = document.getElementById('treeDetailImages');
  fauna.detailCount = document.getElementById('detailCount');
  fauna.screenDiv = document.getElementById('screenDiv');

  document.getElementById('treeViewBox').onclick = function(event) {

    fauna.setupViewMode(fauna.getViewType());
    event.stopPropagation();
  };

  // Checkbox size behavior isn't standardized, and 32px checkboxes look pretty
  // silly, so instead we're extending the checkbox click area with a wrapper
  // div.
  document.getElementById('treeViewBoxTarget').onclick = function() {
    document.getElementById('treeViewBox').click();
  };
  
  document.getElementById('pageNotesButton').onclick = function() {

    var button_img = document.getElementById('pageNotesImg');
    var contents_div = document.getElementById('pageNotesContent');
    var currently_collapsed =
        button_img.getAttribute('src').lastIndexOf('up.png') === -1;
    if (currently_collapsed) {
      contents_div.style.display = 'block';
      button_img.setAttribute('src', 'up.png');
      fauna.staticSelectHeight = fauna.heightOfElement(fauna.staticSelect);
    }
    else {
      contents_div.style.display = 'none';
      button_img.setAttribute('src', 'down.png');
      fauna.staticSelectHeight = fauna.heightOfElement(fauna.staticSelect);
    }
  };

  fauna.setDetailControlEvents();
  fauna.preloadDetailControlImages();

  // Initialize tree view data structure.
  for (var i = 0; i < fauna.categories.length; ++i) {
    fauna.treeCategoryData[fauna.categories[i].id] = [];
  }

  // Sigh - apparently style positions set in a css file don't appear
  // in javascript (ff), but they do appear if set in javascript.
  document.getElementById('thumbsDetailClose').style.top = '-42px';
  document.getElementById('treeDetailClose').style.top = '8px';

  // Cookie to decide thumb or tree view.
  if (document.cookie.indexOf('fView') !== -1) { // Tree.
    document.getElementById('treeViewBox').checked = true;
  }

  fauna.updateEventHandler("resize", window, function() {
    // Redisplay the detail view if needed, in order to pick up the new
    // dimensions.
    if (fauna.thumbsDetailDiv.style.visibility === 'visible') {
      fauna.setThumbsDetailVisible(true);
    } else if (fauna.treeDetailDiv.style.visibility === 'visible') {
      fauna.setTreeDetailVisible(true);
    }
  });
};

document.onkeydown = function(event) {

  if (fauna.thumbsDetailDiv.style.visibility === 'visible' ||
      fauna.treeDetailDiv.style.visibility === 'visible') {

    var scrollDiv, moveDetail, setVisible;
    if (fauna.thumbsDetailDiv.style.visibility === 'visible') {
      scrollDiv = fauna.detailAnimal;
      moveDetail = fauna.moveDetail;
      setVisible = fauna.setThumbsDetailVisible;
    } else {
      scrollDiv = fauna.treeDetailImages;
      moveDetail = function() { return; };
      setVisible = fauna.setTreeDetailVisible;
    }
// http://stackoverflow.com/questions/1629926/element-onkeydown-keycode-javascript
    event = event || window.event;
// http://www.quirksmode.org/js/keys.html
    var charCode = event.keyCode;
    var smallJump = 30;
    var bigJump = 250;
    if (charCode === 40) {
      scrollDiv.scrollTop += smallJump;
    }
    else if (charCode === 38) {
      scrollDiv.scrollTop -= smallJump;
    }
    else if (charCode === 33) {
      scrollDiv.scrollTop -= bigJump;
    }
    else if (charCode === 34) {
      scrollDiv.scrollTop += bigJump;
    }
    else if (charCode === 13 || charCode === 32 || charCode === 39) {
      moveDetail('right');
    }
    else if (charCode === 37) {
      moveDetail('left');
    }
    else if (charCode === 36) {
      moveDetail('fullLeft');
    }
    else if (charCode === 35) {
      moveDetail('fullRight');
    }
    else if (charCode === 27 || charCode === 81) {
      setVisible(false);
    }
    else {
      return true;
    }
    //event.preventDefault();
    //event.stopPropagation();
    return false;
  }
  else { // Send keyboard events to the detail div.
    return true; // Let the browser handle it.
  }
};

fauna.preloadDetailControlImages = function() {

  var fullLeft = new Image();
  fullLeft.src = 'images/fullLeft.png';
  var fullLeftOff = new Image();
  fullLeftOff.src = 'images/fullLeftOff.png';
  var left = new Image();
  left.src = 'images/left.png';
  var leftOff = new Image();
  leftOff.src = 'images/leftOff.png';
  var right = new Image();
  right.src = 'images/right.png';
  var rightOff = new Image();
  rightOff.src = 'images/rightOff.png';
  var fullRight = new Image();
  fullRight.src = 'images/fullRight.png';
  var fullRightOff = new Image();
  fullRightOff.src = 'images/fullRightOff.png';
  var close = new Image();
  close.src = 'images/close.png';
};

fauna.setDetailControlEvents = function() {

  var detailFullLeft = document.getElementById('detailFullLeft');
  detailFullLeft.onclick =
    function() { fauna.moveDetail("fullLeft"); };
  detailFullLeft.onmousedown =
    function() { fauna.detailClickDown('detailFullLeft'); };
  detailFullLeft.onmouseup =
    function() { fauna.detailClickUp('detailFullLeft'); };
  var detailLeft = document.getElementById('detailLeft');
  detailLeft.onclick = function() { fauna.moveDetail("left"); };
  detailLeft.onmousedown =
    function() { fauna.detailClickDown('detailLeft'); };
  detailLeft.onmouseup =
    function() { fauna.detailClickUp('detailLeft'); };
  var detailRight = document.getElementById('detailRight');
  detailRight.onclick = function() { fauna.moveDetail("right"); };
  detailRight.onmousedown =
    function() { fauna.detailClickDown('detailRight'); };
  detailRight.onmouseup =
    function() { fauna.detailClickUp('detailRight'); };
  var detailFullRight = document.getElementById('detailFullRight');
  detailFullRight.onclick =
    function() { fauna.moveDetail("fullRight"); };
  detailFullRight.onmousedown =
    function() { fauna.detailClickDown('detailFullRight'); };
  detailFullRight.onmouseup =
    function() { fauna.detailClickUp('detailFullRight'); };
  var thumbsDetailClose = document.getElementById('thumbsDetailClose');
  thumbsDetailClose.onclick =
    function() { fauna.setThumbsDetailVisible(false); };
  thumbsDetailClose.onmousedown =
    function() { fauna.detailClickDown('thumbsDetailClose'); };
  thumbsDetailClose.onmouseup =
    function() { fauna.detailClickUp('thumbsDetailClose'); };
  var treeDetailClose = document.getElementById('treeDetailClose');
  treeDetailClose.onclick =
    function() { fauna.setTreeDetailVisible(false); };
  treeDetailClose.onmousedown =
    function() { fauna.detailClickDown('treeDetailClose'); };
  treeDetailClose.onmouseup =
    function() { fauna.detailClickUp('treeDetailClose'); };
};

window.onscroll = function() {

  var offset = fauna.pageYOffset();
  if (fauna.scrollIsHigh && offset > fauna.staticSelectHeight) {
    fauna.staticSelect.style.visibility = "hidden";
    fauna.fixedSelect.style.visibility = "visible";
    fauna.scrollIsHigh = false;
  }
  else if (!fauna.scrollIsHigh && offset <= fauna.staticSelectHeight) {
    fauna.staticSelect.style.visibility = "visible";
    fauna.fixedSelect.style.visibility = "hidden";
    fauna.scrollIsHigh = true;
  }
};

// Find the right event handler for this browser.
if (document.addEventListener) {
  fauna.updateEventHandler = function(event, maybeElement, handler) {
    var element = (typeof(maybeElement) === 'string') ?
      document.getElementById(maybeElement) : maybeElement;
    element.addEventListener(event, handler, false);
  };
}
else if (document.attachEvent) {
  fauna.updateEventHandler = function(event, maybeElement, handler) {
    var element = (typeof(maybeElement) === 'string') ?
      document.getElementById(maybeElement) : maybeElement;
    element.attachEvent("on" + event, handler);
  };
}
else {
  fauna.updateEventHandler = fauna.error_alert;
}

// Find the right pageOffsets for this browser.
if (typeof(window.pageYOffset) == 'number') {
  fauna.pageYOffset = function() { return window.pageYOffset; };
}
else if (typeof(document.documentElement.scrollTop) === 'number') {
  fauna.pageYOffset = function() {
    return document.documentElement.scrollTop;
  };
}
else {
  fauna.pageYOffset = function() { return 0; }
}

// Find the right xmlhttprequest generator for this browser.
// (based on Javascript: the definitive guide by David Flanagan (O'Reilly 2006))
var factories = [function() { return new XMLHttpRequest(); },
                 function() { return new ActiveXObject("MSXML2.XMLHTTP"); },
                 function() { return new ActiveXObject("Microsoft.XMLHTTP"); }];
for (var i = 0, length = factories.length; i < length; ++i) {
  try {
    var factory = factories[i];
    var request = factory();
    if (request != null) {
      fauna.ajaxObject = factory;
      break;
    }
  }
  catch(e) {
    continue;
  }
}
if (!fauna.ajaxObject) {
  fauna.ajaxObject = fauna.error_alert;
}

// IE8 doesn't support these ... good to know!
if (!document.ELEMENT_NODE) {
  document.ELEMENT_NODE = 1;
  document.ATTRIBUTE_NODE = 2;
  document.TEXT_NODE = 3;
  document.CDATA_SECTION_NODE = 4;
  document.ENTITY_REFERENCE_NODE = 5;
  document.ENTITY_NODE = 6;
  document.PROCESSING_INSTRUCTION_NODE = 7;
  document.COMMENT_NODE = 8;
  document.DOCUMENT_NODE = 9;
  document.DOCUMENT_TYPE_NODE = 10;
  document.DOCUMENT_FRAGMENT_NODE = 11;
  document.NOTATION_NODE = 12;
}

fauna.error_alert = function(message) {

  if (!message) {
    alert("Sorry, your browser doesn't seem to be supported - a more recent browser may be required.");
  }
  else {
    alert(message);
  }
};

// http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
fauna.windowWidth = function() {

  var myWidth = 0;
  if( typeof( window.innerWidth ) == 'number' ) {
    //Non-IE
    myWidth = window.innerWidth;
  } else if( document.documentElement &&
             document.documentElement.clientWidth ) {
    //IE 6+ in 'standards compliant mode'
    myWidth = document.documentElement.clientWidth;
  } else if( document.body && document.body.clientWidth ) {
    //IE 4 compatible
    myWidth = document.body.clientWidth;
  }
  return myWidth;
};

fauna.windowHeight = function() {

  var myHeight = 0;
  if( typeof( window.innerHeight ) == 'number' ) {
    //Non-IE
    myHeight = window.innerHeight;
  } else if( document.documentElement &&
             document.documentElement.clientHeight ) {
    //IE 6+ in 'standards compliant mode'
    myHeight = document.documentElement.clientHeight;
  } else if( document.body && document.body.clientHeight ) {
    //IE 4 compatible
    myHeight = document.body.clientHeight;
  }
  return myHeight;
};

fauna.splitCSVList = function(list) {

  // ''.split(',') is normally [""].
  return list === '' ? [] : list.split(',');
};

/* Cross-Browser Split 1.0.1
(c) Steven Levithan <stevenlevithan.com>; MIT License
An ECMA-compliant, uniform cross-browser split method */

var cbSplit;

// avoid running twice, which would break `cbSplit._nativeSplit`'s reference to the native `split`
if (!cbSplit) {

cbSplit = function (str, separator, limit) {
    // if `separator` is not a regex, use the native `split`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
        return cbSplit._nativeSplit.call(str, separator, limit);
    }

    var output = [],
        lastLastIndex = 0,
        flags = (separator.ignoreCase ? "i" : "") +
                (separator.multiline  ? "m" : "") +
                (separator.sticky     ? "y" : ""),
        separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
        separator2, match, lastIndex, lastLength;

    str = str + ""; // type conversion
    if (!cbSplit._compliantExecNpcg) {
        separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
    }

    /* behavior for `limit`: if it's...
    - `undefined`: no limit.
    - `NaN` or zero: return an empty array.
    - a positive number: use `Math.floor(limit)`.
    - a negative number: no limit.
    - other: type-convert, then use the above rules. */
    if (limit === undefined || +limit < 0) {
        limit = Infinity;
    } else {
        limit = Math.floor(+limit);
        if (!limit) {
            return [];
        }
    }

    while (match = separator.exec(str)) {
        lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser

        if (lastIndex > lastLastIndex) {
            output.push(str.slice(lastLastIndex, match.index));

            // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
            if (!cbSplit._compliantExecNpcg && match.length > 1) {
                match[0].replace(separator2, function () {
                    for (var i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined) {
                            match[i] = undefined;
                        }
                    }
                });
            }

            if (match.length > 1 && match.index < str.length) {
                Array.prototype.push.apply(output, match.slice(1));
            }

            lastLength = match[0].length;
            lastLastIndex = lastIndex;

            if (output.length >= limit) {
                break;
            }
        }

        if (separator.lastIndex === match.index) {
            separator.lastIndex++; // avoid an infinite loop
        }
    }

    if (lastLastIndex === str.length) {
        if (lastLength || !separator.test("")) {
            output.push("");
        }
    } else {
        output.push(str.slice(lastLastIndex));
    }

    return output.length > limit ? output.slice(0, limit) : output;
};

cbSplit._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
cbSplit._nativeSplit = String.prototype.split;

} // end `if (!cbSplit)`

// For convenience...
String.prototype.split = function (separator, limit) {
    return cbSplit(this, separator, limit);
};

