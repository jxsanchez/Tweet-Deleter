const CHAR_LIMIT = 280;
const MAX = 200;

const tweetContent = $(".tweet-content");
const charCount = $(".char-count");
const tweetBtn = $(".tweet-btn");
const likeDelInput = $(".like-del-num");
const likeDelCheckbox = $(".like-del-checkbox");

// Initialize character count.
charCount.text(tweetContent.val().length);

// Disable tweet button
tweetBtn.addClass("disabled");
tweetBtn.prop("disabled", true);

// Character count update function
tweetContent.on("input", () => {
    // Store number of characters in tweet
    count = tweetContent.val().length;

    // Set number in character count
    charCount.text(count);

    // Change character count font color based on number of characters
    if(count == 0) {
        charCount.css("color", "#657786");
        tweetBtn.addClass("disabled");
        tweetBtn.prop("disabled", true);
    } else if (count > 0 && count < 280) {
        charCount.css("color", "#35a824");
        tweetBtn.removeClass("disabled");
        tweetBtn.prop("disabled", false);
    } else {
        charCount.css("color", "#f52e14");
        tweetBtn.removeClass("disabled");
        tweetBtn.prop("disabled", false);
    }
});

// Set number of likes to be deleted by checking and unchecking the checkbox
likeDelCheckbox.click(() => {
    // Set number input to 1 when unchecked, else set to MAX
    if(likeDelCheckbox.attr("checked")) {
        likeDelCheckbox.attr("checked", false);
        likeDelInput.val(1);
    } else {
        likeDelCheckbox.attr("checked", true);
        likeDelInput.val(MAX);
    }
});

// Detect changes in number input to check and uncheck 
likeDelInput.on("input", () => {
    // Uncheck checkbox if number is below MAX, else check 
    if(likeDelInput.val() < MAX) {
        likeDelCheckbox.attr("checked", false);
    } else {
        likeDelCheckbox.attr("checked", true);
    }
});
