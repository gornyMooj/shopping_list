// #lista_zakupow.html
// #new_product modal

document.addEventListener('DOMContentLoaded', (event) => { 
    toggleZeroElements ();
})

function toggleZeroElements () {
    const container = document.querySelector('.wrapper-product-list');
    if (container.querySelector('.container-product-list')) {
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
    // cleares all input fileds
    document.getElementById("addNewProductForm").reset();
}



function goBack() {
    window.location.href = "/";
}

function getCurrentLocation() {
	return new Promise ((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    })
}

function removeItemFromDOMSlide(id){
    // removes item from DOM
    const sp = document.getElementById(`p-${id}`)

    if (sp.classList.contains("slide-in-animation")) {
        sp.classList.remove("slide-in-animation")
    } //  when the element has this class 'slide-out' class would not work
    
    sp.classList.add('slide-out');
    // waits for the animation to complete (match duration in CSS)
    sp.addEventListener('animationend', () => {
        sp.remove(); // Remove the element from the DOM after animation ends
        toggleZeroElements();
    });
}

// async taking lat nad long from the browser
function getCurrentLocation() {
	return new Promise ((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    })
}

// timeout getCurrentLocation()
async function getCurrentLocationWithTimeout(timeoutMs) {
    return Promise.race([
        getCurrentLocation(),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Geolocation timeout")), timeoutMs)
        )
    ]);
}


// add product to the UI
function addProductToPage(product) {
    console.log(product);
    const productHTML = `
        <div class="container-product-list" id="p-${product._id}">
            <div class="list-info-home">
                <div class="first-row-sp">
                    <div class="shopping-list-name">
                        <span style="font-weight: 600;">&nbsp;${product.name}</span>
                    </div>
                    <div class="shopping-list-count">
                        ${product.quantity}&nbsp;
                    </div>
                </div>
                <div class="second-row-sp">
                    &nbsp;Dodany: ${product.added_date} <br>
                    &nbsp;Zakupiony: <span id="p-date-${product._id}">${product.purchase_date || 'None'}</span> <br>
                    <button onclick="deleteProduct('${product.name}', '${product._id}', '${product.id_zakupy}')" title="Wykasuj produkt z listy zakupów"> USUŃ PRODUKT</button>
                </div>
            </div>
            <div 
                class="bought-product-icon ${product.purchase_date == null ? 'bought-false' : 'bought-true'}"
                id="p-status-${product._id}"
                onclick="toggleStatus('${product._id}')"
                title="Zmień status produktu"
            >
                ${product.purchase_date == null ? '👎' : '👍'}
            </div>
        </div>
    `;
    // adds element to the page
    const container = document.querySelectorAll('.wrapper-product-list')[0]; 
    container.insertAdjacentHTML('afterbegin', productHTML);
    // adds the animation class
    const newElement = document.getElementById(`p-${product._id}`);
    newElement.classList.add('slide-in-animation');
   
    // closes modal on the very and 
    toggleModal()
}


async function addNewProduct(id) {
    // adds a new product to db
    // TODO:  must add the product to UI
    event.preventDefault(); // prevents form from reloading the page

    const name = document.getElementById('name-form-add-modal').value;
    const quantity = document.getElementById('quantity-form-add-modal').value;

    const productDetails = {
        name: name,
        quantity: quantity,
        lat:  'Unknown', 
        long: 'Unknown', 
        id_zakupy: id
    };

    // getting geolocation details
	try {
		let position = await getCurrentLocationWithTimeout(1000);
        productDetails.lat = position.coords.latitude;
        productDetails.long =  position.coords.longitude;
    } catch (error) {
        showErrorMessage('Twoja geolokalizacja nie jest aktywna. ' + error)
    }

    // inserting data to db
    try {
        let db_response = await fetch('/add-product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productDetails)
        });

        db_response = await db_response.json();

        if (db_response && db_response.message) {
            addProductToPage(db_response.product_details);
            toggleZeroElements ()
        } else {
            // fetch worked however there was problem on the server side 
            showErrorMessage("Failed to add product UI: " + db_response.error);  
        }
    } catch(error) {
        showErrorMessage('Error when inserting data to db: ' + error)
    };

    

};


async function deleteProduct(name, product_id, id) {
    // removes Product form DB
    // TODO: js code will remove the rpoduct from UI
    const productDetails = {
        name: name,
        product_id: product_id
    };
    // POST request
    try {
        const response  = await fetch('/delete-product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productDetails)
        });
        const db_response = await response.json();

        if (db_response && db_response.message) {
            removeItemFromDOMSlide(product_id);
        } else {
            showErrorMessage(`Nie udało się usunąć produktu: ${db_response.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage("Wystąpił błąd podczas usuwania produktu. ");
    }
}


// change product status
async function toggleStatus(id) {
    // purchase_date must be taken from DOM toggleStatus(id, purchase_date)
    let purchase_date_e = document.getElementById("p-date-"+ id);
    let purchase_date_text = purchase_date_e.innerHTML;
    const data = {
        product_id: id,
        purchase_date: purchase_date_text,
        lat:  'Unknown', 
        long: 'Unknown'
    };

    try {
        position = await getCurrentLocationWithTimeout(1000); //  timeout whne issues with firefox or any other browser than chrome
        data.lat = position.coords.latitude;
        data.long = position.coords.longitude;
    } catch (error) {
        showErrorMessage('Błąd pobierania geolokalizacji: ' +  error.message);
    }

    try {
        const response  = await fetch('/update-product-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const db_response = await response.json();
        if (db_response && db_response.message) {
            let element = document.getElementById("p-status-" + id);
            if (element.classList.contains("bought-true")) {
                element.classList.replace("bought-true", "bought-false")
                element.textContent = '👎';
                
            } else {
                element.classList.replace("bought-false", "bought-true")
                element.textContent = '👍';
            }
            
            // actions to be performed if the status has been successfully changed
            if (db_response.purchase_date) {
                purchase_date_e.textContent = db_response.purchase_date;
            } else {
                purchase_date_e.textContent = 'None';
            }
            

        } else {
            showErrorMessage(`Nie udało się zmienić statusu produktu ${db_response.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage("Coś poszło nie tak. Spróbuj ponownie później!");
    }
}






