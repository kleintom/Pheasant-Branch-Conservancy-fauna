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

  var faunaDiv = document.getElementById('thumbFauna');
  faunaDiv.innerHTML = '';
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
      thumbsDiv.style.width = '200px';
      // No images.
    }
    else {
      tipDiv.setAttribute('class', 'nameTip');
      tipDiv.setAttribute('id', thisAnimal.id + 'nameTip');
      thumbsDiv.onmouseover = fauna.createThumbTip(thisAnimal.common,
                                                   thisAnimal.scientific,
                                                   tipDiv, true, false);
      thumbsDiv.onmouseout = fauna.createThumbTipCanceller(tipDiv);
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
  fauna.scrollToId('instructions');
};

// Populate <tipDiv> with <common> and <scientific> display text; if
// <returnDisplayer> is true then return a function that schedules
// display of the tip, otherwise make the tip permanently visible.
fauna.createThumbTip = function(common, scientific, tipDiv,
                                returnDisplayer, displayDNRNote) {

  var displayText = '';

  if (displayDNRNote) {
    displayText = '<strong>WI DNR Prairie Insect Survey:</strong> ';
  }

  if (common !== '' && scientific !== '') {
    displayText += common + ' - ' + '<i>' + scientific + '</i>';
  }
  else if (common !== '') {
    displayText += common;
  }
  else if (scientific !== '') {
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
      var displayFunc = function() {tipDiv.style.visibility = 'visible';};
      fauna.thumbTimerId = setTimeout(displayFunc, 500);
    }
  };
};

// Return a function that cancels display of the tool tip in <tipDiv>.
fauna.createThumbTipCanceller = function(tipDiv) {

  return function() {
    fauna.cancelThumbTip(tipDiv);
  };
};

fauna.cancelThumbTip = function(tipDiv) {

  if (fauna.thumbTimerId !== 0) {
    clearTimeout(fauna.thumbTimerId);
    fauna.thumbTimerId = 0;
  }
  tipDiv.style.visibility = 'hidden';
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
        var thumbsDiv = document.getElementById(thisAnimal.id);
        var tipDiv = fauna.tipDivForAnimal(thisAnimal);
        thumbsDiv.onmouseover = fauna.createTipDisplayFunction(tipDiv);
        thumbsDiv.onmouseout = fauna.createThumbTipCanceller(tipDiv);
      }
    }
  }
  else { // Tree view.
    var data = fauna.treeCategoryData[fauna.currentCategory];
    for (var i = 0; i < data.length; ++i) { // For each animal.
      var zoomButton = document.getElementById('zb' + i);
      zoomButton.onclick = fauna.createTreeThumbsClickHandler(i);
    }
  }
};

fauna.tipDivForAnimal = function(animal) {

  return document.getElementById(animal.id + 'nameTip');
};

fauna.categoryLength = function() {

  return fauna.thumbCategoryData[fauna.currentCategory].length;
}

// Input is the index of the animal in the current category to create the detail
// for.
fauna.createDetailClickHandler = function(i) {

  return function() {
    var animal = fauna.thumbCategoryData[fauna.currentCategory][i];
    var thumbsDiv = document.getElementById(animal.id);
    fauna.curThumbsDiv = thumbsDiv;
    var lastDivOnLine = fauna.getLastDivOfClassOnLine(thumbsDiv, 'thumbs');
    fauna.loadThumbDetailAnimal(animal, lastDivOnLine);
    fauna.positionThumbDetailDiv(thumbsDiv, lastDivOnLine);
    // Make sure the thumb tool tip is hidden.
    fauna.cancelThumbTip(fauna.tipDivForAnimal(animal));
    fauna.preloadImages(i - 1);
    fauna.preloadImages(i + 1);
  };
};

fauna.getLastDivOfClassOnLine = function(lineDiv, className) {

  var lineHeight = lineDiv.getBoundingClientRect().top;
  var lastDivOnLine = lineDiv;
  var nextSibling = lineDiv.nextSibling;
  while (nextSibling) {
    if (nextSibling.className !== className) {
      nextSibling = nextSibling.nextSibling;
      continue;
    }
    // (All the divs in a given line should have the same height from the top
    // (since they all have the same content height by design), but we're
    // allowing a little wiggle just in case.)
    if (Math.abs(nextSibling.getBoundingClientRect().top - lineHeight) < 10) {
      lastDivOnLine = nextSibling;
      nextSibling = nextSibling.nextSibling;
    }
    else {
      break;
    }
  }

  return lastDivOnLine;
};

// If <forceReposition> then we guarantee that the thumb detail div will be
// reinserted in its current proper position (but not scrolled to).
fauna.positionThumbDetailDiv = function(thumbsDiv, lastDivOnThumbsLine,
                                        forceReposition) {

  forceReposition = forceReposition || false;

  var thisThumbLineHeight = fauna.heightOfElement(lastDivOnThumbsLine);
  if (thisThumbLineHeight !== fauna.curThumbDetailLineHeight ||
      forceReposition) {
    // We're either making the detail div visible or moving it.
    lastDivOnThumbsLine.parentNode.insertBefore(fauna.thumbsDetailDiv,
                                                lastDivOnThumbsLine.nextSibling);
    fauna.thumbsDetailDiv.style.display = 'block';
    fauna.curThumbDetailLineHeight = fauna.heightOfElement(thumbsDiv);
    if (!forceReposition) {
      var thumbsDivHeight = thumbsDiv.getBoundingClientRect().height;
      // The maximum height of a thumbs div if its images only take up one line
      // (actually it's a little less, but that's okay).
      var maxOneLineThumbsDivHeight = 250;
      if (window.innerHeight > 600 &&
          thumbsDivHeight < maxOneLineThumbsDivHeight) {
        fauna.scrollToElement(thumbsDiv);
      }
      else {
        // There's not enough room to show both the thumbs and the detail, so
        // scroll to leave just a little room at the top of the detail div so
        // that the fauna category select doesn't cover up the detail animal
        // title (particularly on narrow screens).
        fauna.scrollToElement(fauna.thumbsDetailDiv, -55);
      }
    }
  }
  fauna.positionThumbDetailMarker(thumbsDiv);
};

// Position the little decorative triangle thing that points from the detail div
// to the thumb div of the animal being displayed in the detail.
fauna.positionThumbDetailMarker = function(thumbsDiv) {

  var thumbsDivCoords = thumbsDiv.getBoundingClientRect();
  var detailDivCoords = fauna.thumbsDetailDiv.getBoundingClientRect();

  var markerWidth = 13;
  var detailDivLeftBorder =
      parseInt(getComputedStyle(fauna.thumbsDetailDiv).borderLeftWidth, 10);
  // X coordinate of the marker within the detail div.
  var relativeMarkerX = thumbsDivCoords.left + (thumbsDivCoords.width / 2) -
      markerWidth - detailDivCoords.left - detailDivLeftBorder;
  fauna.thumbsDetailMarker.style.left = relativeMarkerX + 'px';
};

fauna.resetThumbsDetailView = function() {

  fauna.thumbsDetailDiv.style.display = 'none';
  fauna.curThumbDetailLineHeight = -1;
  // Make sure the thumbs detail div is moved out of the thumbs div so that we
  // don't lose the detail div when we blank the thumbs div (we do hold a
  // reference to the detail div, which seems to be enough for this to not be
  // necessary on recent browsers, but it is an issue on IE9 and IE10 at least).
  document.getElementById('faunaDiv').appendChild(fauna.thumbsDetailDiv);
};

// <prevSibling> is the last thumbs div prior to where the detail div should be
// placed.
fauna.loadThumbDetailAnimal = function(animal, prevSibling) {

  // Set the title.
  var scientific =
      animal.scientific ? ' (<i>' + animal.scientific + '</i>)' : '';
  fauna.thumbsDetailTitleDiv.innerHTML =
    '<b>' + animal.common + scientific + '</b>';
  // Now load the rest of the animal details.
  fauna.detailAnimal.innerHTML = '';
  fauna.detailAnimal.appendChild(fauna.createAnimalDetailDiv(animal));
};

// Load animal with <index> in the detail div, removing any previous animal.
fauna.loadDetailAnimal = function(index) {

  fauna.detailAnimal.innerHTML = '';
  var animal = fauna.thumbCategoryData[fauna.currentCategory][index];
  fauna.detailAnimal.appendChild(fauna.createAnimalDetailDiv(animal));
};

// Input is the <index> of the animal in the current category to create the
// detail for.
fauna.createTreeThumbsClickHandler = function(index) {

  var zoomed = true;
  return function() {
    var animal = fauna.treeCategoryData[fauna.currentCategory][index];
    var thumbsDiv = document.getElementById('th' + index);
    var zoomButtonDiv = document.getElementById('zb' + index);
    var animalDiv = document.getElementById('an' + index);

    thumbsDiv.innerHTML = '';
    var images = fauna.splitCSVList(animal.images);
    var srcPrefix = zoomed ? 'images/' : 'images/z';
    var thumbContainerClass;
    if (zoomed) { // Full-size images and animal div.
      animalDiv.setAttribute('class', 'treeAnimalWide');
      zoomButtonDiv.setAttribute('class', 'zoomButtonOut');
      thumbContainerClass = 'wideThumbContainer';
    }
    else { // Thumbnail images and constrained-width animal div.
      animalDiv.setAttribute('class', 'treeAnimal');
            zoomButtonDiv.setAttribute('class', 'zoomButtonIn');
      thumbContainerClass = 'thumbContainer';
    }
    for (var i = 0; i < images.length; ++i) {
      var thumbContainer = document.createElement('div');
      thumbContainer.setAttribute('class', thumbContainerClass);
      var imageElt = document.createElement('img');
      imageElt.setAttribute('src', srcPrefix + images[i] + '.jpg');
      thumbContainer.appendChild(imageElt);
      thumbsDiv.appendChild(thumbContainer);
    }
    zoomed = !zoomed;
  };
};

// Preload the images for the animal at index <index> in the current category.
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

// Given <animal> data, return a div displaying the animal's info.
fauna.createAnimalDetailDiv = function(animal) {

  var animalDiv = document.createElement('div');
  animalDiv.setAttribute('class', 'animal');

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

  // Taxonomy.
  if (animal.taxonomy) {
    // Elements will be [taxonName, taxonTitle] pairs.
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

    fauna.createClassificationDiv(animalDiv, taxonomy);
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

  return animalDiv;
};

fauna.taxonTitles = {};
fauna.taxonTitles['c'] = 'Class';
fauna.taxonTitles['sc'] = 'Subclass';
fauna.taxonTitles['uo'] = 'Superorder';
fauna.taxonTitles['o'] = 'Order';
fauna.taxonTitles['io'] = 'Infraorder';
fauna.taxonTitles['so'] = 'Suborder';
fauna.taxonTitles['uf'] = 'Superfamily';
fauna.taxonTitles['f'] = 'Family';
fauna.taxonTitles['sf'] = 'Subfamily';
fauna.taxonTitles['ut'] = 'Supertribe';
fauna.taxonTitles['t'] = 'Tribe';
fauna.taxonTitles['st'] = 'Subtribe';
fauna.taxonTitles['g'] = 'Genus';
fauna.taxonTitles['sg'] = 'Subgenus';
fauna.taxonTitles['s'] = 'Species';
fauna.taxonTitles['ss'] = 'Subspecies';
fauna.taxonTitles['nt'] = 'No Taxon';

// <taxonomyList> is an ordered list of [taxonName, taxonTitle] pairs.
fauna.createClassificationDiv = function(parentElement, taxonomyList,
                                         hideClassification) {

  var container = document.createElement('div');
  var titleDiv = document.createElement('div');
  titleDiv.setAttribute('class', 'notesTitle');
  titleDiv.appendChild(document.createTextNode('Classification'));
  container.appendChild(titleDiv);

  var taxonomyDiv = fauna.createTaxonomyDiv(taxonomyList);
  // Hide the taxonomy behind a button unless we have plenty of screen space.
  var minDim = 800;
  if (fauna.windowWidth() < minDim || fauna.windowHeight() < minDim) {
    taxonomyDiv.style.display = 'none';
    titleDiv.setAttribute('id', 'taxonomyButton');
    // Add a button to display the taxonomy.
    // TODO? We're not letting the user re-hide the taxonomy, and if this detail
    // div gets closed and then reopened, we won't remember the
    // hidden/unhidden state of the taxonomy.  (Also we recreate the detail div
    // every time a thumb div is clicked, so clicking a thumb div, opening the
    // taxonomy, and then clicking the same thumb div again will close the
    // taxonomy again.)
    var taxButton = document.createElement('img');
    taxButton.setAttribute('src', 'images/display.png');
    titleDiv.onclick = function() {
      taxonomyDiv.style.display = 'block';
      titleDiv.removeAttribute('id'); // It's no longer a "button".
      taxButton.style.display = 'none';
    };
    titleDiv.appendChild(taxButton);
  }
  else {
    taxonomyDiv.style.display = 'block';
  }
  container.appendChild(taxonomyDiv);
  parentElement.appendChild(container);
};

// Append data from taxonomyList to parentElement.
fauna.createTaxonomyDiv = function(taxonomyList) {

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

  return taxDiv;
};

// Create a div to display <notesText> in a paragraph with a title
// <notesTitle>.
fauna.createNotesElement = function(notesTitle, notesText, notesClass) {

  var notesDiv = document.createElement('div');
  notesClass = notesClass ? notesClass + ' notes' : 'notes';
  notesDiv.setAttribute('class', notesClass);
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

// Return a number that increases by one from zero each time the function is
// called.
fauna.getSelectCount = function() {

  var count = 0;
  var getSelectCount = function() {
    var returnCount = count;
    ++count;
    return returnCount;
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
  document.getElementById('faunaTitle').innerHTML =
    fauna.getCategoryTitle(category);
  if (fauna.getViewType() === 'thumb') {
    fauna.resetThumbsDetailView();
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
  faunaDiv.innerHTML = '';
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
    document.getElementById('select0').blur();
    document.getElementById('select1').blur();
  };
};

fauna.setVisible = function() {

  document.getElementById('faunaDiv').style.display = 'block';
  // Now never do this again.
  fauna.setVisible = function() {};
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
  var tagName = '';
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
    // The number of animals added to this category prior to this one ==
    // future index of this animal in categoryData (see below).
    var animalCount = categoryData.length;
    var thisAnimal = animals[i];
    var animalDiv = document.createElement('div');
    animalDiv.setAttribute('class', 'treeAnimal');
    animalDiv.setAttribute('id', 'an' + animalCount);
    //// Title.
    var titleDiv = document.createElement('div');
    titleDiv.setAttribute('class', 'title');
    titleDiv.innerHTML = '<b><i>' + thisAnimal.scientific +
      '</i> -- ' + thisAnimal.common + '</b>';
    animalDiv.appendChild(titleDiv);
    //// Images.
    if (thisAnimal.nonDNRAnimal && thisAnimal.images) {
      var imagesContainer = document.createElement('div');
      imagesContainer.setAttribute('class', 'thumbsContainer');
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
      // Images zoom in/out button.
      var zoomButton = document.createElement('div');
      zoomButton.setAttribute('class', 'zoomButtonIn');
      zoomButton.setAttribute('id', 'zb' + animalCount);
      imagesContainer.appendChild(thumbsDiv);
      // (We're adding the zoom button after the thumbs div so that the button
      // appears over the thumbs.)
      imagesContainer.appendChild(zoomButton);
      animalDiv.appendChild(imagesContainer);
      // Remember this animal for the next time this category is loaded.
      var shortAnimal = {};
      shortAnimal.images = thisAnimal.images;
      shortAnimal.nonDNRAnimal = thisAnimal.nonDNRAnimal;
      categoryData.push(shortAnimal);
      zoomButton.onclick = fauna.createTreeThumbsClickHandler(animalCount);
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
  var faunaDiv = document.getElementById('treeFauna');
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
  fauna.scrollToId('treeViewBox');
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
    fauna.resetThumbsDetailView();
    document.getElementById('thumbFauna').innerHTML = '';
    fauna.loadCurrentCategory();
  }
};

fauna.loadAnimalsFromXML = function(dom) {

  var root = dom.documentElement;
  // Get us started - parents are
  // [taxon node, full-taxonomy-to-that-node] pairs.
  curParents = [[root, '']];
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
    fauna.error_alert('Ajax error: ' + request.responseText.substr(0, 200));
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
  request.open('GET', 'pbc_fauna_ajax.php?category=' + category, true);
  request.send(null);
  fauna.setLoading();
};

fauna.setLoading = function() {

  var loadingElement = document.getElementById('faunaLoading');
  fauna.loadingTimerId = setInterval(fauna.loadingFunction(loadingElement), 200);
};

fauna.removeLoading = function() {

  clearInterval(fauna.loadingTimerId);
  document.getElementById('faunaLoading').innerHTML = '';
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

fauna.scrollToElement = function(element, offset) {

  if (element) {
    if (offset === undefined) {
      offset = -4; // Scroll slightly above the target.
    }

    window.scrollTo(0, fauna.heightOfElement(element) + offset);
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
fauna.currentCategory = '';
// Timer id for the thumb images "tool tip".
fauna.thumbTimerId = 0;
// As hack, we use low assigned image numbers to indicate that certain entries
// should be displayed as WDNR survey entries (which don't themselves come
// with images).
fauna.imageCutoff = 100;
// Page height of the top of the currently selected thumb group, or -1 if no
// thumb group is currently selected.
fauna.curThumbDetailLineHeight = -1;
// The thumbs div corresponding to the current content of the thumbs detail div;
// non-null if and only if the thumbs detail is currently visible.
fauna.curThumbsDiv = null;

window.onload = function() {

  fauna.loadingTimerId = -1; // Remember the timer id for the "loading" span.
  fauna.scrollIsHigh = true; // true if we're showing the static select.

  var staticSelect = fauna.createSelect();
  document.getElementById('staticHolder').appendChild(staticSelect);
  var fixedSelect = fauna.createSelect();
  document.getElementById('fixedHolder').appendChild(fixedSelect);

  var selectHeight = staticSelect.offsetHeight;
  var selectWidth = staticSelect.offsetWidth;
  document.selectForm0.style.left = selectWidth + 'px';
  document.selectForm1.style.left = selectWidth + 'px';

  var backgroundPadding = 20;
  var backgroundHeight = selectHeight + backgroundPadding;
  document.getElementById('staticBackground').style.height =
     backgroundHeight + 'px';
  document.getElementById('fixedBackground').style.height =
     backgroundHeight + 'px';
  document.selectForm0.style.top = (backgroundPadding/2) + 'px';
  document.selectForm1.style.top = (backgroundPadding/2) + 'px';

  var backgroundWidth = selectWidth + backgroundPadding;
  document.getElementById('staticBackground').style.width =
    backgroundWidth + 'px';
  document.getElementById('fixedBackground').style.width =
    backgroundWidth + 'px';
  document.selectForm0.style.left = (backgroundPadding/2) + 'px';
  document.selectForm1.style.left = (backgroundPadding/2) + 'px';

  fauna.staticSelect = document.getElementById('staticSelect');
  fauna.staticSelectHeight = fauna.heightOfElement(fauna.staticSelect);
  fauna.fixedSelect = document.getElementById('fixedSelect');

  fauna.thumbsDetailDiv = document.getElementById('thumbsDetailDiv');
  fauna.thumbsDetailMarker = document.getElementById('thumbsDetailMarker');
  fauna.thumbsDetailTitleDiv = document.getElementById('thumbsDetailTitle');
  fauna.detailAnimal = document.getElementById('detailAnimal');

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

  // Cookie to decide thumb or tree view.
  if (document.cookie.indexOf('fView') !== -1) { // Tree.
    document.getElementById('treeViewBox').checked = true;
  }

  fauna.updateEventHandler('resize', window, function() {
    // Redisplay the detail view if needed, in order to pick up the new
    // dimensions.
    if (fauna.curThumbsDiv !==  null) {
      // Reposition the detail div in case the thumbs divs on curThumbsDiv's
      // line changed after the resize (this will also reposition the detail
      // div's marker pointing to the thumbs div).
      var lastDivOnLine = fauna.getLastDivOfClassOnLine(fauna.curThumbsDiv,
                                                        'thumbs');
      fauna.positionThumbDetailDiv(fauna.curThumbsDiv, lastDivOnLine, true);
    }
  });
};

fauna.preloadDetailControlImages = function() {

  var close = new Image();
  close.src = 'images/close.png';
  var zoomIn = new Image();
  zoomIn.src = 'images/zoomIn.png';
  var zoomOut = new Image();
  zoomOut.src = 'images/zoomOut.png';
  var triangle = new Image();
  triangle.src = 'images/triangle.png';
  var display = new Image();
  display.src = 'images/display.png';
};

fauna.setDetailControlEvents = function() {

  var thumbsDetailClose = document.getElementById('thumbsDetailClose');
  thumbsDetailClose.onclick = function() {
    fauna.thumbsDetailDiv.style.display = 'none'
    fauna.curThumbDetailLineHeight = -1;
    fauna.curThumbsDiv = null;
  };
};

window.onscroll = function() {

  var offset = fauna.pageYOffset();
  if (fauna.scrollIsHigh && offset > fauna.staticSelectHeight) {
    fauna.staticSelect.style.visibility = 'hidden';
    fauna.fixedSelect.style.visibility = 'visible';
    fauna.scrollIsHigh = false;
  }
  else if (!fauna.scrollIsHigh && offset <= fauna.staticSelectHeight) {
    fauna.staticSelect.style.visibility = 'visible';
    fauna.fixedSelect.style.visibility = 'hidden';
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
if (typeof(window.pageYOffset) === 'number') {
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

// IE8 doesn't support these ... good to know! TODO: can I get rid of these now?
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

