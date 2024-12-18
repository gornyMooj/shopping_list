// #lista_zakupow.html
// #new_product modal

// console.log(JSON.stringify(shopping_list_ser));

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
        sp.remove(); // removes the element from the DOM after animation ends
        shopping_list_ser = shopping_list_ser.filter(function(p) {
            return p._id != id;
         }); // removes product from json
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
        lat_added:  'Unknown', 
        long_added: 'Unknown', 
        id_zakupy: id
    };

    // getting geolocation details
	try {
		let position = await getCurrentLocationWithTimeout(1000);
        productDetails.lat_added = position.coords.latitude;
        productDetails.long_added =  position.coords.longitude;
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
            shopping_list_ser.push(db_response.product_details); // adds product to JSON
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
            // updaets coordinates in the JSON data
            shopping_list_ser.forEach((p) => {
                if (p._id === db_response.product_details.product_id) {
                    p.lat = db_response.product_details.lat;
                    p.long = db_response.product_details.long;
                }
            });
        } else {
            showErrorMessage(`Nie udało się zmienić statusu produktu ${db_response.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage("Coś poszło nie tak. Spróbuj ponownie później!");
    }
}


// change list name 
function showChangeTitleContainer() {
    document.querySelector(".top-header-title").style.display = 'none';
    document.querySelector(".change-title-container").style.display = 'block';
}

function hideChangeTitleContainer(newName) {
    document.querySelector(".main-title-holder").textContent = newName;
    document.querySelector(".change-title-container").style.display = 'none';
    document.querySelector(".top-header-title").style.display = 'block';

}

async function changeTitle(list_id) {
    const newName = document.getElementById('new-name-input').value;
    hideChangeTitleContainer(newName);
    let data = {
        newName: newName,
        list_id: list_id
    };
    try {
        let db_response = await fetch('/change-list-title', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        db_response = await db_response.json(); 

        if (db_response && db_response.message) {
            hideChangeTitleContainer(newName);
        } else {
            showErrorMessage("Nie zmieniono nazwy listy: " + db_response.error);  
        }

    } catch (error) {
        showErrorMessage('Niestety nie udalo sie zmienic nazwy listy. ' + error)
    }
}


async function closeList(list_id) {
    // uploading data to db
    try {
        let data = {
            id: list_id,
            close: "true"
        };
        db_response = await fetch('/change-list-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        db_response = await db_response.json();
        if (db_response && db_response.message) {
            window.location.href= `/shopping-list/${list_id}`;
        } else {
            showErrorMessage(db_response.error);
        }
    } catch(error) {
        showErrorMessage('Error when inserting data to db: ' + error)
    }
}



// ############### stats part ###################
let map_bought, map_added;
let markers_bought = L.markerClusterGroup();
let markers_added = L.markerClusterGroup();
let markers_list_bought = [];
let markers_list_added = [];

function addMap() {
    const map_bm_bought = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    const map_bm_added = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    map_bought = L.map('map_bought');
    map_bm_bought.addTo(map_bought);
    map_bought.setView([51.9194, 19.1451], 5);

    map_added = L.map('map_added');
    map_bm_added.addTo(map_added);
    map_added.setView([51.9194, 19.1451], 5);
}


function addLayersToMap() {
    // remove all layers markers.clearLayers();
    if (markers_list_bought.length > 0) {
        markers_bought.clearLayers();
        markers_list_bought = [];
    }

    if (markers_list_added.length > 0) {
        markers_added.clearLayers();
        markers_list_added = [];
    }


    // adds markers to markers_bought markerClusterGroup & markers_list_bought
    shopping_list_ser.forEach((product) => {
        if (product.lat != 'Unknown' &&  product.long != 'Unknown') {
            const marker_bought = L.marker([product.lat, product.long])
            marker_bought.bindPopup(product.name);
            markers_bought.addLayer(marker_bought);
            markers_list_bought.push(marker_bought);
        };
        if (product.lat_added != 'Unknown' &&  product.long_added != 'Unknown') {
            const marker_added = L.marker([product.lat_added, product.long_added])
            marker_added.bindPopup(product.name);
            markers_added.addLayer(marker_added);
            markers_list_added.push(marker_added);
        };
       
    });

    // adds markerClusterGroup to map
    if(markers_list_bought.length != 0) {
        let markers_bounds = markers_bought.getBounds();
        map_bought.fitBounds(markers_bounds);
        map_bought.addLayer(markers_bought);
   } else {
        map_bought.setView([51.9194, 19.1451], 5);
   }

   if(markers_list_added.length != 0) {
        let markers_bounds = markers_added.getBounds();
        map_added.fitBounds(markers_bounds);
        map_added.addLayer(markers_added);
    } else {
        map_added.setView([51.9194, 19.1451], 5);
    }

}


function showStatsMenu() {
    // opens popup menu with maps overlay and more
    const modal = document.getElementById('modalBottomStats');
    const overlay = document.getElementById('modalStatsOverlay');
    const isOpen = modal.classList.contains('open');
    if(!map_bought) {
        addMap(); 
    };
    if (isOpen) {
      modal.classList.remove('open');
      overlay.classList.remove('open');
    } else {
      modal.classList.add('open');
      overlay.classList.add('open');
      addLayersToMap();
    };
}




