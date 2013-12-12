var fauna = {};

// Display the <data> for <category> in thumbnail format.
fauna.displayThumbCategory = function(category, data) {
  
  // sort by common name, except put empty names at the end
  var sortFunction = function(a, b) {
    var aFirstImage = parseInt(a.images);
    var bFirstImage = parseInt(b.images);
    if (aFirstImage >= 100 && bFirstImage < 100) {
      return -1;
    }
    else if (aFirstImage < 100 && bFirstImage >= 100) {
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
  fauna.categoryData[category] = data; // save for detail requests
  fauna.currentCategory = category;

  var faunaDiv = document.getElementById("fauna");
  faunaDiv.innerHTML = ""; // bye bye
  for (var i = 0; i < data.length; ++i) { // for each animal
      
    var thisAnimal = data[i];
    var thumbsDiv = document.createElement('div');
    thumbsDiv.setAttribute('class', 'thumbs');
    thumbsDiv.setAttribute('id', thisAnimal.id);
    thumbsDiv.onclick = fauna.createDetailClickHandler(i);
    var tipDiv = document.createElement('div');
    var images = thisAnimal.images.split(',');
    if (images[0] < 100) { // special category; make tip always visible
      tipDiv.setAttribute('class', 'nameTipOn');
      fauna.createThumbTip(thisAnimal.common, thisAnimal.scientific,
                           tipDiv, false);
      thumbsDiv.style.width = "200px";
      // no images
    }
    else {
      tipDiv.setAttribute('class', 'nameTip');
      tipDiv.setAttribute('id', thisAnimal.id + 'nameTip');
      thumbsDiv.onmouseover = fauna.createThumbTip(thisAnimal.common,
                                                   thisAnimal.scientific,
                                                   tipDiv, true);
      thumbsDiv.onmouseout = fauna.cancelThumbTip(tipDiv);
      // images
      for (var j = 0; j < images.length; ++j) {
        var imageElt = document.createElement('img');
        imageElt.setAttribute('src', 'images/z' + images[j] + '.jpg');
        thumbsDiv.appendChild(imageElt);
      }
    }
    thumbsDiv.appendChild(tipDiv);
    faunaDiv.appendChild(thumbsDiv);
  }
  fauna.categoryHTML[category] = faunaDiv.innerHTML;
  fauna.scrollToId("instructions");
};

// Populate <tipDiv> with <common> and <scientific> display text; if
// <returnDisplayer> is true then return a function that schedules
// display of the tip, otherwise make the tip permanently visible
fauna.createThumbTip = function(common, scientific, tipDiv,
                                returnDisplayer) {
  
  var displayText = "";
  // HACK for specail DNR prairie insect survey
  if (!returnDisplayer) {
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

  var data = fauna.categoryData[fauna.currentCategory];
  for (var i = 0; i < data.length; ++i) { // for each animal
    var thisAnimal = data[i];
    var thumbsDiv = document.getElementById(thisAnimal.id);
    thumbsDiv.onclick = fauna.createDetailClickHandler(i);
    // renew the tip handlers
    var  images = thisAnimal.images.split(',');
    if (images[0] >= 100) { // needs a tip handler
      var thisId = thisAnimal.id;
      var thumbsDiv = document.getElementById(thisId);
      var tipDiv = document.getElementById(thisId + 'nameTip');
      thumbsDiv.onmouseover = fauna.createTipDisplayFunction(tipDiv);
      thumbsDiv.onmouseout = fauna.cancelThumbTip(tipDiv);
    }      
  }
};

fauna.categoryLength = function() {

  return fauna.categoryData[fauna.currentCategory].length;
}

// Update the detail controls based on the current detail index.
fauna.updateDetailControls = function() {

  var curIndex = fauna.curDetailIndex(); // 0-based
  var maxIndex = fauna.categoryLength() - 1;
  // detail can change from any one index to any other, so need to
  // check all cases each time
  if (curIndex === 0) {
    var left = document.getElementById('detailLeft');
    left.style.cursor = "default";
    // do I need to set size again, even though it's the same as the
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

// Input is the index (0-based!) of the animal in the current category
// to create the detail for.
fauna.createDetailClickHandler = function(i) {

  return function() {
    fauna.loadDetailAnimal(i);
    fauna.updateDetailControls();
    fauna.setDetailVisible(true);
    fauna.preloadImages(i - 1);
    fauna.preloadImages(i + 1);
  };
};

// Load animal with <index> (0-based!) in the detail div, removing any
// previous animal.
fauna.loadDetailAnimal = function(index) {

  fauna.detailAnimal.innerHTML = "";
  var animal = fauna.categoryData[fauna.currentCategory][index];
  fauna.detailAnimal.appendChild(fauna.createAnimalDetailDiv(animal));
  fauna.setDisplayedIndex(index + 1);
};

// Display the <index> (1-based!) of the detail animal in the detail
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

// Return the current detail index (0-based!)
fauna.curDetailIndex = function() {

  var indexText = fauna.detailCount.innerHTML;
  return parseInt(indexText.substring(0, indexText.indexOf('/'))) - 1;
};

// Move the detail index as specified by <where>.
fauna.moveDetail = function(where) {

  var newIndex = 0; // 0-based
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

// Preload the images for the animal at index <index>
// (0-based!) in the current category.
fauna.preloadImages = function(index) {

  if (index < 0 || index >= fauna.categoryLength()) {
    return;
  }
  var animal = fauna.categoryData[fauna.currentCategory][index];
  var images = animal.images.split(',');
  // There's some indication online that individual img objects are
  // necessary to actually preload multiple images
  var imageRefs = [];
  for (var i = 0; i < images.length; ++i) {
    imageRefs[i] = new Image();
    imageRefs[i].src = 'images/' + images[i] + '.jpg';
  }
};

// Make the detail div visible if <visible> is true, else hide it.
fauna.setDetailVisible = function(visible) {

  if (visible) {
    // disable scrolling on main window
    // NOTE that keyboard scrolling is still active
    document.body.style.overflowY= 'hidden';
    fauna.detailDiv.style.top = fauna.pageYOffset() + 16 + "px";
    fauna.detailDiv.style.height = fauna.windowHeight() - 50 + "px";
    fauna.opaqueDiv.style.visibility = 'visible';
    fauna.detailDiv.style.visibility = 'visible';
  }
  else {
    fauna.opaqueDiv.style.visibility = 'hidden';
    fauna.detailDiv.style.visibility = 'hidden';
    // enable scrolling on main window
    document.body.style.overflowY= 'visible';
  }
  // make sure the thumb tool tip is hiddent either way
  fauna.cancelThumbTip();
};

// Given <animal> data, return a div displaying the animal's info.
fauna.createAnimalDetailDiv = function(animal) {

  var animalDiv = document.createElement('div');
  animalDiv.setAttribute('class', 'animal');
    
  // title
  var titleDiv = document.createElement('div');
  titleDiv.setAttribute('class', 'title');
  var scientific =
    animal.scientific ? ' (<i>' + animal.scientific + '</i>)' : '';
  titleDiv.innerHTML = '<b>' + animal.common + scientific + '</b>';
  animalDiv.appendChild(titleDiv);
  
  // taxonomy
  if (animal.taxonomy) {
    var taxonomy = [];
    var taxons = animal.taxonomy.split('!');
    for (var i = 0; i < taxons.length; ++i) {
      var thisTaxon = taxons[i];
      var parts = thisTaxon.split('@');
      var taxonTitle = parts[0];
      var taxonName = parts[1];
      taxonomy.push([taxonTitle, taxonName]);
    }
    fauna.addClassification(animalDiv, taxonomy);
  }

  // history
  if (animal.history) {
    animalDiv.appendChild(fauna.createNotesElement('Life history and ecology',
                                                   animal.history));
  }
  // id info
  if (animal.identification) {
    animalDiv.appendChild(fauna.createNotesElement('Identification Notes',
                                                   animal.identification));
  }
  // links
  if (animal.links) {
    animalDiv.appendChild(fauna.createNotesElement('Links',
                                                   animal.links));
  }
  
  // images
  var images = animal.images.split(',');
  var firstImageNumber = parseInt(images[0], 10);
  console.log(firstImageNumber);
  if (firstImageNumber > 100) { // image numbers < 100 are special category
    var imagesDiv = document.createElement('div');
    imagesDiv.setAttribute('class', 'detailImages');
    for (var j = 0; j < images.length; ++j) {
      var imageElt = document.createElement('img');
      imageElt.setAttribute('src', 'images/' + images[j] + '.jpg');
      imagesDiv.appendChild(imageElt);
    }
    animalDiv.appendChild(imagesDiv);
  }
  return animalDiv;
};

// Append data from taxonomyList to parentElement.
fauna.addClassification = function(parentElement, taxonomyList) {

  taxonTitles = {};
  taxonTitles['c'] = "Class";
  taxonTitles['sc'] = "Subclass";
  taxonTitles['uo'] = "Superorder";
  taxonTitles['o'] = "Order";
  taxonTitles['io'] = "Infraorder";
  taxonTitles['so'] = "Suborder";
  taxonTitles['uf'] = "Superfamily";
  taxonTitles['f'] = "Family";
  taxonTitles['sf'] = "Subfamily";
  taxonTitles['ut'] = "Supertriber";
  taxonTitles['t'] = "Tribe";
  taxonTitles['st'] = "Subtribe";
  taxonTitles['g'] = "Genus";
  taxonTitles['sg'] = "Subgenus";
  taxonTitles['s'] = "Species";
  taxonTitles['ss'] = "Subspecies";
  taxonTitles['nt'] = "No Taxon";

  var container = document.createElement('div');
  var titleDiv = document.createElement('div');
  titleDiv.setAttribute('class', 'notesTitle');
  titleDiv.appendChild(document.createTextNode('Classification'));
  container.appendChild(titleDiv);
  // do what bugguide does (css-wise)
  var taxDiv = document.createElement('div');
  taxDiv.setAttribute('class', 'classification');
  var parentDiv = taxDiv;
  var genus = ''; // remember genus when species comes around
  var species = ''; // remember species when subspecies comes around
  for (var i = 0; i < taxonomyList.length; ++i) {
    var taxonTitle = taxonomyList[i][0];
    var taxonName = taxonomyList[i][1];

    var thisTaxonDiv = document.createElement('div');
    thisTaxonDiv.setAttribute('class', 'taxon');

    var titleSpan = document.createElement('span');
    titleSpan.setAttribute('class', 'taxonTitle');
    titleSpan.appendChild(document.createTextNode(taxonTitles[taxonTitle] + ' '));
    thisTaxonDiv.appendChild(titleSpan);

    var nameSpan = document.createElement('span');
    nameSpan.setAttribute('class', 'taxonDesc');
    if (taxonTitle == 'g') { // genus
      genus = taxonName;
      var italics = document.createElement('i');
      italics.appendChild(document.createTextNode(taxonName));
      nameSpan.appendChild(italics);
    }
    else if (taxonTitle == 's') { // species
      species = taxonName;
      var italics = document.createElement('i');
      italics.appendChild(document.createTextNode(taxonName));
      nameSpan.appendChild(italics);
      var fullName = ' (' + genus + ' ' + taxonName + ')';
      nameSpan.appendChild(document.createTextNode(fullName));
    }
    else if (taxonTitle == 'ss') { // subspecies
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
fauna.createNotesElement = function(notesTitle, notesText) {

  var notesDiv = document.createElement('div');
  var titleDiv = document.createElement('div');
  titleDiv.setAttribute('class', 'notesTitle');
  titleDiv.appendChild(document.createTextNode(notesTitle));
  notesDiv.appendChild(titleDiv);
  var notesParagraph = document.createElement('p');
  notesDiv.appendChild(notesParagraph);
  notesText = notesText.replace(/&quot;/g, '"');
  // replace \n with <br />
  var lines = notesText.split("\n");
  for (var i = 0; i < lines.length - 1; ++i) {
    fauna.createLinks(lines[i], notesParagraph);
    notesParagraph.appendChild(document.createElement('br'));
  }
  fauna.createLinks(lines[lines.length - 1], notesParagraph);
  return notesDiv;
};

fauna.displayInstructions = function() {

  document.getElementById('instructions').style.visibility = 'visible';
  // Okay, it's visible now forevermore
  fauna.displayInstructions = function() {};
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

// Apparently need to use a closure here since IE doesn't set "this" on
// event handlers
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
     // bye bye to the previous category
    document.getElementById("fauna").innerHTML = "";
    document.getElementById("faunaTitle").innerHTML =
      fauna.getCategoryTitle(category);

    var categoryHTML = fauna.categoryHTML[category];
    if (categoryHTML) {
      document.getElementById("fauna").innerHTML = categoryHTML;
      fauna.renewClickHandlers();
      fauna.removeLoading();
      fauna.scrollToId("instructions");
    }
    else {
      fauna.loadCategory(category);
    }
    document.getElementById('select1').blur();
    document.getElementById('select2').blur();
  };
};

fauna.setVisible = function() {

  document.getElementById("faunaDiv").style.display = "block";
  // never do this again
  fauna.setVisible = function() {};
};

// Input is the string the browser provides for a style position
// property.  Return the position in px if the input was in px,
// othwerwise (either already 0 or bad news) return 0.
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

  // replace http://'s with links
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
      else { // change '<a href...' markup into actual link
        // linkText is of the form
        // <a href="plant1,plant2,...">text text...</a>
        // where the plant names are plant codes as used on the pbc_plant site
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

fauna.loadAnimalsFromXML = function(dom) {

  var root = dom.documentElement;
  // get us started - parents are 
  // [taxon node, full-taxonomy-to-that-node] pairs
  curParents = [[root, ""]];
  animals = [];
  while (curParents.length > 0) {
    // process the current nodes
    var childNodes = [];
    for (var i = 0; i < curParents.length; ++i) {
      var thisNode = curParents[i][0];
      var taxonParent = curParents[i][1];
      var child = thisNode.firstChild;
      while (child) {
        if (child.nodeType == document.ELEMENT_NODE) {
          var tagName = child.tagName;
          if (tagName != 'z') { // another taxon level
            var taxonName = child.getAttribute('t');
            childNodes.push([child, taxonParent + tagName + '@' + taxonName + '!']);
          }
          else { // an animal
            var animalObject = {};
            animalObject.common = fauna.getData(child, 'c');
            animalObject.images = fauna.getData(child, 'i');
            animalObject.id = fauna.getData(child, 'n');
            animalObject.scientific = fauna.getData(child, 'sc');
            animalObject.history = fauna.getData(child, 'h');
            animalObject.links = fauna.getData(child, 'l');
            animalObject.identification = fauna.getData(child, 'id');
            // remove the trailing ! on taxonParent
            animalObject.taxonomy = taxonParent.substring(0, taxonParent.length - 1);
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
      //alert(request.responseText);
      var dom = request.responseXML;
      var category = dom.documentElement.tagName;
      animalsList = fauna.loadAnimalsFromXML(dom);
      fauna.displayThumbCategory(category, animalsList);
      fauna.displayInstructions();
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
//    alert(fauna.heightOfElement(element));
    window.scrollTo(0, fauna.heightOfElement(element) - 4);
  }
};

fauna.scrollToId = function(id) {

  var element = document.getElementById(id);
  if (element) {
    fauna.scrollToElement(element);
  }
};

fauna.categories = [{id: 'bees', title: 'Bees'},
                    {id: 'beetles', title: 'Beetles'},
                    {id: 'butterflies', title: 'Butterflies'},
                    {id: 'caterpillars', title: 'Caterpillars'},
                    {id: 'dragonflies', title: 'Dragonflies and damselflies'},
                    {id: 'flies', title: 'Flies'},
                    {id: 'galls', title: 'Galls, leaf mines, etc.'},
                    {id: 'grasshoppers', title: 'Grasshoppers, katydids, and crickets'},
                    {id: 'moths', title: 'Moths'},
                    {id: 'other', title: 'Other'},
                    {id: 'recent', title: 'Recent (added in the last 60 days)'},
                    {id: 'snakes', title: 'Snakes, frogs, turtles and toads'},
                    {id: 'spiders', title: 'Spiders'},
                    {id: 'bugs', title: 'True bugs'},
                    {id: 'wasps', title: 'Wasps'}];

// we remember the innerHTML of categories that have already been loaded
fauna.categoryHTML = {};
// an array of animal data for each category
fauna.categoryData = {};
// remember the current category (as a string)
fauna.currentCategory = "";
// timer id for the thumb images "tool tip"
fauna.thumbTimerId = 0;

window.onload = function() {

  fauna.loadingTimerId = -1; // remember the timer id for the "loading" span
  fauna.scrollIsHigh = true; // true if we're showing the static select

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

  fauna.detailDiv = document.getElementById('detailDiv');
  fauna.detailAnimal = document.getElementById('detailAnimal');
  fauna.detailCount = document.getElementById('detailCount');
  fauna.opaqueDiv = document.getElementById('opaqueDiv');

  fauna.setDetailControlEvents();
  fauna.preloadDetailControlImages();

  // sigh - apparently style positions set in a css file don't appear
  // in javascript (ff), but they do appear if set in javascript.
  document.getElementById("detailClose").style.top = "-47px";
};

document.onkeydown = function(event) {

  if (fauna.detailDiv.style.visibility === 'visible') {
// http://stackoverflow.com/questions/1629926/element-onkeydown-keycode-javascript
    event = event || window.event;
// http://www.quirksmode.org/js/keys.html
    var charCode = event.keyCode;
    var smallJump = 30;
    var bigJump = 250;
    if (charCode === 40) {
      fauna.detailAnimal.scrollTop += smallJump;
    }
    else if (charCode === 38) {
      fauna.detailAnimal.scrollTop -= smallJump;
    }
    else if (charCode === 33) {
      fauna.detailAnimal.scrollTop -= bigJump;
    }
    else if (charCode === 34) {
      fauna.detailAnimal.scrollTop += bigJump;
    }
    else if (charCode === 13 || charCode === 32 || charCode === 39) {
      fauna.moveDetail('right');
    }
    else if (charCode === 37) {
      fauna.moveDetail('left');
    }
    else if (charCode === 36) {
      fauna.moveDetail('fullLeft');
    }
    else if (charCode === 35) {
      fauna.moveDetail('fullRight');
    }
    else if (charCode === 27 || charCode === 81) {
      fauna.setDetailVisible(false);
    }
    else {
      return true;
    }
    //event.preventDefault();
    //event.stopPropagation();
    return false;
  }
  else { // send keyboard events to the detail div
    return true; // let the browser handle it
  }
};

fauna.preloadDetailControlImages = function() {

  var fullLeft = new Image();
  fullLeft.src = 'images/fullLeft.png';
  var fullLeftOff = new Image();
  fullLeftOff = 'images/fullLeftOff.png';
  var left = new Image();
  left.src = 'images/left.png';
  var leftOff = new Image();
  leftOff = 'images/leftOff.png';
  var right = new Image();
  right.src = 'images/right.png';
  var rightOff = new Image();
  rightOff = 'images/rightOff.png';
  var fullRight = new Image();
  fullRight.src = 'images/fullRight.png';
  var fullRightOff = new Image();
  fullRightOff = 'images/fullRightOff.png';
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
  var detailClose = document.getElementById('detailClose');
  detailClose.onclick =
    function() { fauna.setDetailVisible(false); };
  detailClose.onmousedown =
    function() { fauna.detailClickDown('detailClose'); };
  detailClose.onmouseup =
    function() { fauna.detailClickUp('detailClose'); };
};

window.onscroll = function() {

  var offset = fauna.pageYOffset();//window.pageYOffset;
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

// find the right event handler for this browser
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

// find the right pageOffsets for this browser
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

// find the right xmlhttprequest generator for this browser
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

// for convenience...
String.prototype.split = function (separator, limit) {
    return cbSplit(this, separator, limit);
};

