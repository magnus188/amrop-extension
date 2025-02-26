document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("newPromptModal");
    const closeModal = document.getElementById("closeModal");

    // Close modal when the close button is clicked
    if (closeModal) {
        closeModal.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    // Close modal when clicking outside the modal content
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Get the form and its submit button
    const newPromptForm = document.getElementById("newPromptForm");
    const submitButton = newPromptForm.querySelector("button[type='submit']");

    // Initially disable the submit button until the form is valid
    submitButton.disabled = true;

    // Function to check form validity and update the submit button's state
    function checkFormValidity() {
        if (newPromptForm.checkValidity()) {
            submitButton.disabled = false;
            submitButton.classList.add("active");
        } else {
            submitButton.disabled = true;
        }
    }

    // Listen for input and change events on the form to re-validate it
    newPromptForm.addEventListener("input", checkFormValidity);
    newPromptForm.addEventListener("change", checkFormValidity);
});