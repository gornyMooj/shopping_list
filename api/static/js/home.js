// # home.html

/*
 - alerts replace with proper handlers
*/

console.log(no_products) // to be removed 

let closed;
let toggleElement;
let listID;


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


function goBack() {
     window.location.href= '/'
}


function getCurrentLocation() {
	return new Promise ((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    })
}
async function creatdNewList() {
    // perhaps u will need to add handler for timeoout issue
    let geoDetails = {
        lat:  'Unknown', 
        long: 'Unknown',
        name: 'Unknown', 
        display_name: 'Unknown'
    };
    let position;
    let nominatim_data;
    let db_response;

    // getting geolocation details
	try {
		position = await getCurrentLocation();
        geoDetails.lat = position.coords.latitude;
        geoDetails.long =  position.coords.longitude;
    } catch (error) {
        showErrorMessage('Twoja geolokalizacja nie jest aktywna. Lista nie będzie zawierać żadnych szczegółów geograficznych. ' + error)
    }

    if (['lat', 'long'].some(key => geoDetails[key] !== "Unknown"))  {
        const nominatimURL = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${geoDetails.lat}&lon=${geoDetails.long}&zoom=10`;
        try {
            //nominatim_data = await fetch(nominatimURL); // fetch and .json() are two separate asynchronous operations
            nominatim_data = await fetch(nominatimURL, {
                headers: {
                    'User-Agent': 'YourAppName/1.0'
                }
            });
            nominatim_data = await nominatim_data.json();
            geoDetails.name = nominatim_data?.name || "Not provided"; // IF NOT AVAILABLE IN NOMINATIM RETURN "Not provided"
            geoDetails.display_name = nominatim_data?.display_name || "Not provided";
        } catch (error) {
            showErrorMessage('Błąd podczas pobierania szczegółów geolokalizacji z nominatim: : ' + error) // error handler needed probably needed

        }
    }
    
    // uploading data to db
    try {
        db_response = await fetch('/add-shopping-list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(geoDetails)
        });

        db_response = await db_response.json();
        if (db_response && db_response.message) {
            // REDIRECT TO THE SHOPPING LIST
            window.location.href = `/shopping-list/${db_response.id}`;
        } else {
            showErrorMessage("Nie udało się utworzyć nowej listy.");
        }
    } catch(error) {
        showErrorMessage('Błąd podczas wstawiania danych do bazy danych: ' + error)
    }
}	



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
    closed = false; 
    listID = id;

    toggleModal();

    const modalDeleteButton = document.querySelectorAll('.modal-delete-btn')[0] 
    modalDeleteButton.onclick = () => {
        confirmRemovalSP(id);
    };

    // styles toggleElement based on closed
    toggleElement = document.querySelector('.toggle-element');
    toggleElement.addEventListener('click', toggleSlider) 
    toggleElement.style.backgroundColor = "lightseagreen";
    toggleElement.innerHTML = "TAK"; 
    toggleElement.style.left = "0";
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
            removeItemFromDOMSlide(id)
        } else {
            showErrorMessage(`Nie udało się usunąć produktu: ${db_response.error}`);
        }
    } catch (error) {
        showErrorMessage("Wystąpił błąd podczas usuwania produktu: " + error);
    }
}


// CLOSING THE LIST PART
async function closeList() {
    // uploading data to db
    try {
        let data = {
            id: listID,
            close: "true"
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
        showErrorMessage('Error when inserting data to db: ' + error)
    }
} 

// TOGGLE WHEN CLICKED
function toggleSlider() {
    const userConfirmed = confirm("Are you sure you want to close the list?");
    toggleElement.removeEventListener('click', toggleSlider) // remove onclick
    if (userConfirmed) {
        // ADD REMOVE ONCLICK   !!!!
        toggleElement.innerHTML = "NIE";
        toggleElement.classList.add('right'); 
    } else {
        toggleModal();
        toggleElement.classList.remove('right'); 

    }
}

// executes when the animation ends
function handleAnimationEnd(event) {
    console.log(`Animation finished! closed state: ${closed}`);
    closeList();

    // ADD CODE TO CLOSE MODAL AND TRIGER ANIMATION TO REMOVE LIST FROM VIEW
    toggleModal(); // close
    toggleElement.classList.remove('right');  // remove animation
    removeItemFromDOMSlide(listID);
}



































































// window.addEventListener("load", (event) => {
//     /* 
//     The load event is fired when the whole page has loaded, including 
//     all dependent resources such as stylesheets
//     , scripts, iframes, and images, except those that are loaded lazily. 
//     */
//     toggleZeroElements ();
// });

function addNewListCode() {
    /*
    - code is not used beacuse the user is redirected to the list menu when a new list added
    */
    // creates a new shopping list element
    const container = document.createElement('div');
    container.className = 'container-shopping-list';
    container.onclick = () => {
        //window.location.href = `/lista_zakupow?id=${item._id}`;   // from response
        window.location.href = `/shopping-list/6745c5e906108ac2aadb87bc`;
    };
    // creates a new list-info-home div
    const listInfoHome = document.createElement('div');
    listInfoHome.className = 'list-info-home';
    // first row (name and count)
    const firstRow = document.createElement('div');
    firstRow.className = 'first-row-sp';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'shopping-list-name';
    nameDiv.textContent = 'Olsztyn'; 
    // nameDiv.textContent = item.name; // from response

    const countDiv = document.createElement('div');
    countDiv.className = 'shopping-list-count';
    countDiv.textContent = '16';
    // countDiv.textContent = item.count;  // from response

    firstRow.appendChild(nameDiv);
    firstRow.appendChild(countDiv);

    // second row (created date)
    const secondRow = document.createElement('div');
    secondRow.className = 'second-row-sp';
    secondRow.textContent = '22 Nov 2o024';
    // secondRow.textContent = item.created_date; // from response

    // appends rows to list-info-home
    listInfoHome.appendChild(firstRow);
    listInfoHome.appendChild(secondRow);

    // creates the edit menu
    const editMenu = document.createElement('div');
    editMenu.className = 'edit-menu-list open-sp-e-modal';
    editMenu.onclick = (event) => {
        event.stopPropagation(); // prevents triggering the parent onclick
        openCloseESPmenu();
    };

    // addinf svg edit menu
    editMenu.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="calc(16px + 0.5vw)" height="calc(16px + 0.5vw)" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
    </svg>
    `;

     // appneds everything to the container
     container.appendChild(listInfoHome);
     container.appendChild(editMenu);

    // Add animation class for smooth entry   !!!!!!!!!!!!
    // container.classList.add('slide-in');


    // appends to parent container | prepend() or appendChild()
    const parent = document.querySelectorAll('.wrapper-shopping-list')[0];

    const breakTag = document.createElement('br');
    parent.prepend(breakTag); // adds space between elements
    parent.prepend(container);
    
    console.log(parent)

}