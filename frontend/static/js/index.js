"use strict";
(() => {
    const inputList = [];
    const pollOptionsAnchor = document.querySelector(".poll-options");
    
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
            if (inputList.every(el => el.value) && pollOptionsAnchor) pollOptionsAnchor.appendChild(createPollOptionInput());
        });
        inputList.push(input);

        return optionEl;
    }
    
    pollOptionsAnchor.querySelectorAll(".poll-option input").forEach(el => {
        el.addEventListener("keyup", () => {
            if (inputList.every(el => el.value) && pollOptionsAnchor) pollOptionsAnchor.appendChild(createPollOptionInput());
        });
        inputList.push(el);
    });
    return createPollOptionInput;
})();