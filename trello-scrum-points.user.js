// ==UserScript==
// @name        Trello Scrum Points
// @description A UserScript that shows Scrum points in Trello
// @author      Louis Lagrange
// @namespace   https://github.com/Minishlink
// @downloadURL https://raw.githubusercontent.com/Minishlink/TrelloScrumPoints/master/trello-scrum-points.user.js
// @updateURL   https://raw.githubusercontent.com/Minishlink/TrelloScrumPoints/master/trello-scrum-points.user.js
// @homepageURL https://github.com/Minishlink/TrelloScrumPoints
// @include     http://*.trello.com/*
// @include     https://*.trello.com/*
// @include     http://trello.com/*
// @include     https://trello.com/*
// @noframes
// @version     1.0
// @grant       none
// ==/UserScript==

(function() {
  'use strict';

  if (document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive") {
    // already loaded
    init();
  } else {
    document.addEventListener("DOMContentLoaded", function() {
      init();
    });
  }

  function init () {
    const pointsRegex = /\(([0-9]*\.?[0-9]+)\)/;

    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if (!MutationObserver) {
      console.warn('TrelloScrumPoints is not compatible with this browser.');
      return;
    }

    function getLastFromArray (array) {
      return array.length > 0 ? array[array.length - 1] : null;
    }

    const initializedCards = [];
    function initializeCard (HTMLCard) {
      const HTMLCardShortId = HTMLCard.querySelector('.card-short-id');
      if (!HTMLCardShortId || initializedCards.includes(HTMLCardShortId.textContent)) return true;
      initializedCards.push(HTMLCardShortId.textContent);
      return false;
    }

    function getPoints(text) {
      const points = text.match(pointsRegex);
      if (!points) return null;
      return Number(points[1]);
    }

    function updatePoints(mutation, HTMLOldCardName, HTMLNewCardName) {
      const HTMLListHeader = mutation.target.closest('.list').querySelector('.list-header');
      const HTMLListPoints = HTMLListHeader.querySelector('.list-points');
      let points = HTMLListPoints && Number(HTMLListPoints.textContent);

      if (HTMLOldCardName) {
        const pointsToRemove = getPoints(HTMLOldCardName.textContent);
        if (pointsToRemove !== null) {
          points -= pointsToRemove;
        }
      }

      if (HTMLNewCardName) {
        const pointsToAdd = getPoints(HTMLNewCardName.textContent);
        if (pointsToAdd !== null) {
          points += pointsToAdd;
        }
      }

      if (points !== null) {
        if (!HTMLListPoints) {
          const pointsContainer = document.createElement("span");
          pointsContainer.className = "list-points";
          pointsContainer.textContent = points;
          HTMLListHeader.appendChild(pointsContainer);
        } else {
          HTMLListPoints.textContent = points;
        }
      }
    }

    function handleChildListChange(mutation) {
      const classList = mutation.target.classList;
      if (classList.contains('list-cards')) {
        // remove cards
        mutation.removedNodes.forEach(HTMLListCard => {
          if (HTMLListCard.classList.contains('list-card')) {
            const HTMLCard = HTMLListCard.querySelector('.list-card-title');
            if (HTMLCard) {
              initializeCard(HTMLCard); // make sure card is initialized
              updatePoints(mutation, HTMLCard, null);
            }
          }
        });
        // add cards
        mutation.addedNodes.forEach(HTMLListCard => {
          if (HTMLListCard.classList.contains('list-card')) {
            const HTMLCard = HTMLListCard.querySelector('.list-card-title');
            if (HTMLCard) {
              initializeCard(HTMLCard); // make sure card is initialized
              updatePoints(mutation, null, HTMLCard);
            }
          }
        });
      } else if (classList.contains('list-card-title')) {
        // change card name
        // the card is already initialized, no need to check
        const HTMLOldCardName = getLastFromArray(mutation.removedNodes);
        const HTMLNewCardName = getLastFromArray(mutation.addedNodes);
        updatePoints(mutation, HTMLOldCardName, HTMLNewCardName);
      } else if (classList.contains('list-card')) {
        // init card
        const HTMLCard = mutation.target.querySelector('.list-card-title');
        if (initializeCard(HTMLCard)) return; // don't update if already initialized
        updatePoints(mutation, null, HTMLCard);
      }
    }

    function handleAttributesChange(mutation) {
      if (mutation.target.classList.contains('list-card') && mutation.oldValue) {
        const HTMLListCard = mutation.target;
        const HTMLCard = HTMLListCard.querySelector('.list-card-title');
        const wasHidden = mutation.oldValue.includes('hide');
        const isNowHidden = HTMLListCard.classList.contains('hide');
        if (wasHidden === isNowHidden) return;
        if (wasHidden) {
          updatePoints(mutation, null, HTMLCard);
        } else {
          updatePoints(mutation, HTMLCard, null);
        }
      }
    }

    new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === "childList") {
          handleChildListChange(mutation);
        } else if (mutation.type === "attributes") {
          handleAttributesChange(mutation);
        }
      });
    }).observe(document.querySelector('#content'), {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true,
    });

    const style = document.createElement('style');
    style.innerHTML = ".list-points {" +
      "position: absolute;" +
      "top: 6px;" +
      "right: 30px;" +
      "padding: 1px 6px 1px 6px;" +
      "background-color: #006580;" +
      "border-color: #005B72;" +
      "border-radius: 10px;" +
      "font-size: 12px;" +
      "font-weight: bold;" +
      "color: #E1FAFB;" +
      "}";
    document.body.appendChild(style);
  }
})();
