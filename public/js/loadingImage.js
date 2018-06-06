document.addEventListener('DOMContentLoaded', bindButtons);

function bindButtons() {
    //adds function to submit button that sends a POST request to the server with a payload of form information for new item to add to database.
    var buttons = document.getElementsByName('submitButton');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function (event) {
            document.getElementById("everything").style.display = "none";
            document.getElementById("loader").style.display = "block";
        });
    }
}