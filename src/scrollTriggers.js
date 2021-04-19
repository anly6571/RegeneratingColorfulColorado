/*
-- WORKFLOW --
  1. Add classes for each step you want to trigger ( I already did that here )
  2. In index.js, do scrollTriggers.addTrigger( a, b, c) where:
       a = {STRING} The classname of the element you want to select ( no periods, symbols or spaces)
       b = {NUMBER} The percent ( as a normal number 0-100 ) from the TOP of the page you want to set as the trigger point. 
           The trigger will fire when the top left of that element is ABOVE that line. 
           IE: b = 20, the trigger will fire when the top-left of the element is < 20% down the page
       c = {FUNCTION} The function you want called when the trigger is hit.
           *NOTE* I've edited the trigger-fire to only fire ONCE when each step is hit, to notify a CHANGE of step instead
                  of firing whenever it's visible. 
  3. Make sure your callback functions (c) from above, trigger transitions for the different layers / selectors
     IE: A step triggers a d3 transition for the "flowersSelect" from opacity 0 to 1
         THEN, updates some state variable that just tells the rest of your program what step it's on. That might not be
         immediately helpful, but it might be later on? I just think a number that says what step the thing is on would be helpful!
  4. Profit?
*/

// Globals
let scrollTriggers = [];
let lastTrigger = -1;

// Add the event listener for scrolling to the page
window.addEventListener("scroll", (e) => onScroll(e));

// Runs on each scroll in the window
function onScroll(e) {
  // For each tracked trigger...
  scrollTriggers.forEach((trigger, i) => {
    // Get its current height... ( higher than the top of the page is < 0, too far down is > window.innerHeight )
    let elementHeight = trigger.element.getBoundingClientRect().y;
    // If it's height is greater than 0 and less than the trigger percentage...
    if (
      elementHeight > 0 &&
      elementHeight < window.innerHeight * (trigger.triggerPoint / 100)
    ) {
      if (lastTrigger !== i) {
        // If it's different than the last one triggered...
        lastTrigger = i; // Update the "last triggered"
        console.log(
          `%c « Triggered "${trigger.element.classList}" » `,
          "background: white; color: black;border-radius: 1rem"
        )
        trigger.callback(trigger.element); //Run the trigger's callback ( and pass the element as a callback )
      }
    }
  });
}

// Add a "ScrollTrigger" to an element based on class name
export function addTrigger(elementClass, triggerPoint, callback) {
  // Select the HTML Element
  const element = document.querySelector(`.${elementClass}`);
  // Add that element and it's callback to the "scroll triggers"
  scrollTriggers.push({ element, callback, triggerPoint });
}

// Return the current y value of an element based on class name
export function getElementY(elementClass) {
  //Select the HTML Element
  const element = document.querySelector(`.${elementClass}`);
  return element.getBoundingClientRect().y;
}

// Not entirely sure this works... or if it's needed?
// // Return a boolean for whether or not the element is in the range
// export function isElementInMiddlePercent(elementClass, percent){
//   // Select the HTML Element
//   const element = document.querySelector(`.${elementClass}`)
//   const elementY = element.getBoundingClientRect().y
//   // Set boundaries for the middle "percent"
//   const windowHeight = window.innerHeight
//   const rangeHeightPixels = ((percent/100) * windowHeight )/2
//   const maxHeight = ( windowHeight / 2 ) - rangeHeightPixels
//   const minHeight = ( windowHeight / 2 ) + rangeHeightPixels

//   //Return a boolean for whether or not it's in the range
//   return ( elementY > minHeight && elementY < maxHeight )
// }
