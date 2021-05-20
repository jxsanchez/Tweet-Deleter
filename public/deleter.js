const MAX = 200;

const likeDelInput = $(".like-del-num");

const likeDelCheckbox = $(".like-del-checkbox");

likeDelCheckbox.click(() => {
    if(likeDelCheckbox.attr("checked")) {
        likeDelCheckbox.attr("checked", false)
        likeDelInput.val(1);
    } else {
        likeDelCheckbox.attr("checked", true)
        likeDelInput.val(MAX);
    }
});