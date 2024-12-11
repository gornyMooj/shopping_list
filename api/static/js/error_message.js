function closeErrorMessage() {
    const popup = document.querySelector(".error-container")
    popup.classList.remove("active-error");
}

function showErrorMessage(e) {
    const popup = document.querySelector(".error-container")
    const containerBody = document.querySelector('.error-container-body');
    popup.classList.add("active-error");
    containerBody.textContent = e;
}