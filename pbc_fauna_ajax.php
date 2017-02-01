<?php
/*
   @source: https://github.com/kleintom/Pheasant-Branch-Conservancy-fauna
   Copyright (C) 2013 Tom Klein

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
header('Content-Type: text/xml');
// so IE doesn't cache ajax requests
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

$CLEAN = array();
$CLEAN['category'] = check_value($_GET['category'],
                                 array('','caterpillars', 'butterflies',
                                       'bugs', 'snakes', 'frogs', 'ants',
                                       'dragonflies', 'flies', 'recent',
                                       'spiders', 'other', 'bees', 'moths',
                                       'grasshoppers', 'beetles', 'wasps',
                                       'galls'),
                                 'Bad category');

$dataPrefix = 'pbData/';

if ($CLEAN['category']) { // return all data for category

  $category = $CLEAN['category'];
  if ($category == 'recent') { // special case
    print getRecent();
    exit;
  }
  print file_get_contents($dataPrefix . $category . '.xml');
  exit;
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

function getRecent() {

  global $dataPrefix;
  $returnDom = new DomDocument();
  $returnDom->appendChild($returnDom->createElement('recent'));
  $recentItems = getRecentItems();
  $xmlHandles = array();
  foreach ($recentItems as $item) {
    $cat = $item[0];
    $id = $item[1];
    if ($xmlHandles[$cat] == null) {
      $xmlFile = $dataPrefix . $cat . '.xml';
      $xmlHandles[$cat] = DOMDocument::load($xmlFile);
    }
    $dom = $xmlHandles[$cat];
    $animalData = getAnimal($id, $dom);
    if ($animalData != null) {
      addToTree($returnDom, $animalData[0], $id, $animalData[1]);
    }
  }
  return $returnDom->saveXML();
}

// Return a list of the recent items in the form
// [[cat, id], [cat, id], ...]
function getRecentItems() {

  global $dataPrefix;
  $recentFile = $dataPrefix . 'recent.xml';
  $recentDom = DOMDocument::load($recentFile);
  $recentItem = $recentDom->documentElement->firstChild;
  $recentItems = array();
  // we'll remove any items that are more than 30 days old
  date_default_timezone_set('America/Chicago');
  $thirtyDaysAgo = strtotime('-60 days');
  $itemsToDelete = array();
  while ($recentItem) {
    $timeNode = $recentItem->getElementsByTagName('t')->item(0);
    $time = $timeNode->firstChild->nodeValue;
    if ($time > $thirtyDaysAgo) { // add to recent
      $catNode = $recentItem->getElementsByTagName('c')->item(0);
      $cat = $catNode->firstChild->nodeValue;
      $idNode = $recentItem->getElementsByTagName('id')->item(0);
      $id = $idNode->firstChild->nodeValue;
      $newItem = array();
      $newItem[0] = $cat;
      $newItem[1] = $id;
      $recentItems[] = $newItem;
    }
    else {
      $itemsToDelete[] = $recentItem;
    }
    $recentItem = $recentItem->nextSibling;
  }
  if (count($itemsToDelete) > 0) {
    foreach ($itemsToDelete as $item) {
      $recentDom->documentElement->removeChild($item);
    }
    $recentDom->save($recentFile);
  }
  return $recentItems;
}

// returns a list of the form
// [[taxTitle,taxName],[taxTitle,taxName],...]
function taxonomyToList($taxonomy) {

  if ($taxonomy == '') {
    return array();
  }
  // code is of the form
  // taxonTitle@taxonName!taxonTitle@taxonName!...
  $taxonLevels = explode('!', $taxonomy);
  $taxonList = array();
  foreach ($taxonLevels as $level) {
    $taxonList[] = explode('@', $level);
  }
  return $taxonList;
}

function addToTree($dom, $taxonomy, $id, $newData) {

  $taxonList = taxonomyToList($taxonomy);
  // Start by finding the last node in the existing xml that matches
  // with the taxonomy in data
  // remember the index of the last taxon that already exists in xml
  $lastExistingIndex = -1;
  // and the last matching node already in the xml tree
  $lastNode = $dom->documentElement;
  $curXmlTaxa = $dom->documentElement->childNodes; // get us started
  foreach ($taxonList as $index => $taxon) {
    $inputTaxonTag = $taxon[0];
    $inputTaxonName = $taxon[1];
    $nodeMatch = null;
    foreach ($curXmlTaxa as $node) {
      if ($node->nodeType == XML_ELEMENT_NODE &&
          $node->tagName == $inputTaxonTag &&
          $node->getAttribute('t') == $inputTaxonName) {
        $nodeMatch = $node;
        break;
      }
    }
    if ($nodeMatch == null) {
      break;
    }
    else {
      $lastExistingIndex = $index;
      $lastNode = $nodeMatch;
      $curXmlTaxa = $nodeMatch->childNodes;
    }
  }
  $taxonomyToAdd = array_slice($taxonList, $lastExistingIndex + 1);
  $endNode = addTaxonomyToNode($taxonomyToAdd, $lastNode, $dom);
  // now add the new animal data at this taxon
  $animalNode = $dom->importNode($newData, true);
  $endNode->appendChild($animalNode);
}

function addTaxonomyToNode($taxonomyToAdd, $parentNode, $dom) {

  $p = $parentNode;
  foreach ($taxonomyToAdd as $level) {
    $tagName = $level[0];
    $attr = $level[1];
    $c = $dom->createElement($tagName);
    $c->setAttribute('t', $attr);
    $p->appendChild($c);
    $p = $c;
  }
  return $p;
}

function getAnimal($faunaId, $dom) {

  $animalNode = getAnimalNode($faunaId, $dom);
  if ($animalNode == null) {
    return null;
  }
  $taxonomy = "";
  $taxonomy = getTaxonomy($animalNode->parentNode);
  $returnArray = array();
  $returnArray[0] = $taxonomy;
  $returnArray[1] = $animalNode;
  return $returnArray;
}

function getAnimalNode($faunaId, $dom) {

  $animalNode = null;
  $idTags = $dom->getElementsByTagName('n');
  foreach ($idTags as $idNode) {
    $thisId = $idNode->firstChild->nodeValue;
    if ($thisId == $faunaId) {
      $animalNode = $idNode->parentNode;
      break;
    }
  }
  return $animalNode;
}

// Input $endNode is the end of the path from root that we return.
function getTaxonomy($endNode) {

  $taxonomy = "";
  $n = $endNode;
  // todo: what I think of as the parent node (the one with tagname
  // $rootTagName) has parentNode non-null - what's its parent?
  $rootTag = $endNode->ownerDocument->documentElement->tagName;
  // (I don't think $n != $rootNode worked)
  while ($n->tagName != $rootTag) {
    $taxonTitle = $n->tagName;
    $taxonName = $n->getAttribute('t');
    $taxonomy = $taxonTitle . '@' . $taxonName . '!' . $taxonomy;
    $n = $n->parentNode;
  }
  // remove the trailing '!'
  return substr($taxonomy, 0, -1);
}

function check_value($input_value, $permissible_values, $error_message) {

  foreach ($permissible_values as $okay_value) {
    if ($input_value == $okay_value) {
      return $input_value;
    }
  }
  // oOps
  return_error($error_message);
}

function return_error($error_message) {

  $xml = new DOMDocument('1.0', 'iso-8859-1');
  $error = $xml->createElement('error');
  $error->appendChild($xml->createTextNode('Fatal error: ' . $error_message));
  $xml->appendChild($error);
  echo $xml->saveXML();
  exit();
}

?>
