function goBack() {
    window.location.href= '/'
}

document.addEventListener('DOMContentLoaded', (event) => { 
    toggleZeroElements ();
})

function toggleZeroElements () {
    const container = document.querySelector('.wrapper-shopping-list');
    if (container.querySelector('.container-shopping-list')) {
        document.querySelector('.zero-items').style.display = 'none';
    } else {
        document.querySelector('.zero-items').style.display = 'block';
    }
};

function toggleModal() {
    document.querySelectorAll('.modal-background').forEach(el => 
        el.classList.toggle('closed-modal') || el.classList.toggle('open-modal')
    );

    document.querySelectorAll('.modal-container').forEach(el => 
        el.classList.toggle('closed-modal') || el.classList.toggle('open-modal')
    );
    // clears header 
    document.querySelector('.modal-container-header').innerHTML = "";
}


function confirmRemovalSP(id) {
    const userConfirmed = confirm("Are you sure you want to do this?");
    if (userConfirmed) {
        deleteShoppingList(id)
        toggleModal();
    } else {
        toggleModal();
    }
}


function openCloseESPmenu(id, display_name) {
    console.log('here we go modal')
    closed = true; 
    listID = id;

    toggleModal();

    const modalDeleteButton = document.querySelectorAll('.modal-delete-btn')[0] 
    modalDeleteButton.onclick = () => {
        confirmRemovalSP(id);
    };

    // styles toggleElement based on closed
    toggleElement = document.querySelector('.toggle-element');
    toggleElement.addEventListener('click', toggleSlider) 
    toggleElement.style.backgroundColor = "var(--no-color)";
    toggleElement.innerHTML = "NIE"; 
    toggleElement.style.left = "calc(var(--slider-width) - var(--toggle-width))";
    // adds an event listener for when the animation ends
    toggleElement.addEventListener('animationend', handleAnimationEnd);
    // adds modal title
    document.querySelector('.modal-container-header').insertAdjacentHTML('afterbegin', display_name);
}


function removeItemFromDOMSlide(id){
    // removes item from DOM
    const sp = document.getElementById(`sp-${id}`)
    sp.classList.add('slide-out');
    // waits for the animation to complete (match duration in CSS)
    sp.addEventListener('animationend', () => {
        sp.remove(); // Remove the element from the DOM after animation ends
        toggleZeroElements ();
    });
}


async function deleteShoppingList(id) {
    // removes shopping list form DB 
    // POST request
    try {
        const response = await fetch(`/delete-shopping-list/${id}`)
        const db_response = await response.json();
        if (db_response && db_response.message) {
            console.log(db_response.message)
            removeItemFromDOMSlide(id)
        } else {
            showErrorMessage(`Nie udało się usunąć produktu: ${db_response.error}`);
        }
    } catch (error) {
        showErrorMessage("Wystąpił błąd podczas usuwania produktu. " + error);
    }
}


// reOPEN THE LIST PART
async function reopenList() {
    // uploading data to db
    try {
        let data = {
            id: listID,
            close: "false"
        };
        console.log(data);
        db_response = await fetch('/change-list-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        db_response = await db_response.json();
        if (db_response && db_response.message) {
            // REDIRECT TO THE SHOPPING LIST
            console.log(db_response.message);
        } else {
            showErrorMessage(db_response.error);
        }
    } catch(error) {
        showErrorMessage('Błąd podczas wstawiania danych do bazy danych: ' + error)
    }
} 

// TOGGLE WHEN CLICKED
function toggleSlider() {
    const userConfirmed = confirm("Are you sure you want to re-open the list?");
    toggleElement.removeEventListener('click', toggleSlider) // remove onclick
    if (userConfirmed) {
        // ADD REMOVE ONCLICK   !!!!
        toggleElement.innerHTML = "TAK";
        toggleElement.classList.add('left'); 
    } else {
        toggleModal();
        toggleElement.classList.remove('left'); 

    }
}

// executes when the animation ends
function handleAnimationEnd(event) {
    console.log(`Animation finished! closed state: ${closed}`);
    reopenList();

    // ADD CODE TO CLOSE MODAL AND TRIGER ANIMATION TO REMOVE LIST FROM VIEW
    toggleModal(); // close
    toggleElement.classList.remove('left');  // remove animation
    removeItemFromDOMSlide(listID);
}