// authentication js code

async function signIn(event) {
    event.preventDefault(); // prevents form from reloading the page

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const data = {
        name: name,
        email: email,
        password: password
    }

    try {
        let db_response = await fetch("/user/signup" , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        db_response = await db_response.json();
        if(db_response.error) {
            // wrong credentials
            showErrorMessage(db_response.error)
        } else {
            window.location.href = "/home";
        }
    } 
    catch (error) {
        showErrorMessage(error)
    }
};







async function logIn(event) {
    event.preventDefault(); // prevents form from reloading the page
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const data = {
        email: email,
        password: password
    }
    try {
        let db_response = await fetch("/user/login" , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        db_response = await db_response.json();
        if(db_response && db_response.name) {
            window.location.href = "/home";  
        } else {
            // Invalid login credentials
            showErrorMessage(db_response.error)
        }
    } catch (error) {
        console.log()
        showErrorMessage('Something is not right on the browser side: ' + error)
    }
}



function toggleAuthOptions() {
    const logginDiv = document.getElementById('login-container');
    const signinDiv = document.getElementById('signup-container');

    // Toggle the "active" class
    logginDiv.classList.toggle('active');
    signinDiv.classList.toggle('active');

    const element = document.querySelector('.button-toggle-auth')
    if(logginDiv.classList.contains('active')) {
        console.log('active');
        element.textContent = 'Sign up'
        element.title = 'Utwórz nowe konto'
    } else {
         element.textContent = 'Log in'
         element.title = 'Zaloguj sie'
    }
}








