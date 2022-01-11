"use strict";
(() => {
    const inputList = [];
    const pollOptionsAnchor = document.querySelector(".poll-options");
    const extendMessageDiv = document.querySelector("#extend-message");
    const inputCounter = document.querySelector("#options-counter");
    const addOptionButton = document.querySelector("#add-options-button");

    function createPollOptionInput() {
        if (inputList.length >= parseInt(MAX_POLL_OPTIONS)) return;
        const optionEl = document.createElement("div");
        optionEl.classList.add("poll-option");
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = MAX_CHARACTER_LENGTH;
        input.name = "poll-option";
        input.placeholder = "Enter your option here";
        optionEl.appendChild(input);
        
        input.addEventListener("keyup", () => {
            if (inputList.every(el => el.value) && pollOptionsAnchor) {
                pollOptionsAnchor.appendChild(createPollOptionInput());
            }
        });
        inputList.push(input);
        inputCounter.textContent = inputList.length;

        return optionEl;
    }
    
    pollOptionsAnchor.querySelectorAll(".poll-option input").forEach(el => {
        el.addEventListener("keyup", () => {
            if (inputList.every(el => el.value) && pollOptionsAnchor) {
                pollOptionsAnchor.appendChild(createPollOptionInput());
            }
        });
        inputList.push(el);
    });

    inputCounter.textContent = inputList.length;

    if (extendMessageDiv) extendMessageDiv.style.display = "block";
    if (addOptionButton) addOptionButton.remove();

    return createPollOptionInput;
})();