const userContainer = document.getElementById("user-container");
const questionsContainer = document.getElementById("security-questions-container");
const passwordContainer = document.getElementById("change-password-container");

const errorBox = document.getElementById('error-box');

const email = document.getElementById("email");
const userSubmit = document.getElementById("user-submit");

const question1 = document.getElementById("question1");
const question2 = document.getElementById("question2");
const answer1 = document.getElementById("answer1");
const answer2 = document.getElementById("answer2");
const answerSubmit = document.getElementById("answer-submit");

const password1 = document.getElementById("password1");
const password2 = document.getElementById("password2");
const passwordToggle1 = document.getElementById("password1-toggle");
const passwordToggle2 = document.getElementById("password2-toggle");
const passwordSubmit = document.getElementById("password-submit");

const questionList = ["What is your favorite food?", "What was your first pet's name?", "What is your mother's maiden name?", "What elementary school did you attend?", "What high school did you attend?"]

// For Password Toggle
passwordToggle1.addEventListener('click', function (e) {
    // toggle the type attribute and icon
    if(password1.getAttribute('type') == 'password'){
        type = 'text';
        passwordToggle1.classList.replace("fa-eye", "fa-eye-slash");
    } else{
        type = 'password';
        passwordToggle1.classList.replace("fa-eye-slash", "fa-eye");
    }

    password1.setAttribute('type', type);
})
passwordToggle2.addEventListener('click', function (e) {
    // toggle the type attribute and icon
    if(password2.getAttribute('type') == 'password'){
        type = 'text';
        passwordToggle2.classList.replace("fa-eye", "fa-eye-slash");
    } else{
        type = 'password';
        passwordToggle2.classList.replace("fa-eye-slash", "fa-eye");
    }

    password2.setAttribute('type', type);
})

// Submitting Email to Reset Its Password
userSubmit?.addEventListener( "click", async function(e) {
    e.preventDefault();
    try {
        // - Store login form data in JSON format
        const data = {
            email: email.value
        }

        if( !areInputFieldsFilled('user-container') ) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Missing email';
            return false;
        }
        
        if( email.classList.contains("invalid") ) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Invalid Email';
            return false;
        }

        const response = await fetch( 'userCheck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( data )
        });


        if( response.status === 201 ) {
            userContainer.style.display = 'none';
            questionsContainer.style.display = 'block';
            
            const questionResponse = await fetch( 'getSecurityQuestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( data )
            });

            if (questionResponse.status === 201)
            {
                const data = await questionResponse.json();
                question1.textContent = questionList[data.question1 - 1];
                question2.textContent = questionList[data.question2 - 1];
                errorBox.style.display = 'none';
            }
            else
            {
                errorBox.style.display = 'block';
                errorBox.textContent = 'Internal server error';
            }
        }
        else {
            errorBox.style.display = 'block';
            switch( response.status ) {
                case 401: {
                    errorBox.textContent = 'Cannot find account';
                } break;
                case 402: {
                    errorBox.textContent = 'Please wait a day before the previous password change';
                } break;
                default: {
                    errorBox.textContent = 'Internal server error';
                }
            }
        }
    } catch( error ) {
        console.log( error );
    }
});

answerSubmit?.addEventListener( "click", async function(e) {
    e.preventDefault();
    try {
        if( !areInputFieldsFilled('security-questions-container') ) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Missing answers';
            return false;
        }
        
        if( answer1.classList.contains("invalid") || answer2.classList.contains("invalid") ) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Invalid Answer';
            return false;
        }

        const data = {email: email.value, answer1: answer1.value, answer2: answer2.value}

        const response = await fetch( 'securityQuestion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( data )
        });

        // - On success, go to dashboard
        if( response.status == 201 ) {
            questionsContainer.style.display = 'none';
            errorBox.style.display = 'none';
            passwordContainer.style.display = 'block';
        }
        else {
            errorBox.style.display = 'block';
            switch( response.status ) {
                case 401: {
                    errorBox.textContent = 'Incorrect Answers';
                } break;
                default: {
                    errorBox.textContent = 'Internal server error';
                }
            }
        }
    } catch( error ) {
        console.log( error );
    }
});

passwordSubmit?.addEventListener( "click", async function(e) {
    e.preventDefault();
    try {
        if( !areInputFieldsFilled('change-password-container') ) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Missing password';
            return false;
        }
        
        if( password1.classList.contains("invalid") || password2.classList.contains("invalid") ) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Invalid password';
            return false;
        }

        if( password1.value != password2.value ) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Passwords do not match.';
            return false;
        }

        const data = {email: email.value, password: password1.value}

        const response = await fetch( 'passwordReset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( data )
        });

        if( response.status === 201 ) {
            window.location.href = "/login";
        }
        else {
            errorBox.style.display = 'block';
            switch( response.status ) {
                case 401: {
                    errorBox.textContent = 'Password Is Same As Current';
                } break;
                case 402: {
                    errorBox.textContent = 'This Password Has Been Used Before';
                } break;
                default: {
                    errorBox.textContent = 'Internal server error';
                }
            }
        }
    } catch( error ) {
        console.log( error );
    }
});

// Input Validation
let emailReg =  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
let alphabeticReg = /^[A-Za-z]+$/;
let passwordReg = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

email.addEventListener('input', function() {
    if (emailReg.test(email.value)) {
        email.classList.remove('invalid');
    } else {
        email.classList.add('invalid');
    }
});
answer1.addEventListener('input', function() {
    if (alphabeticReg.test(answer1.value)) {
        answer1.classList.remove('invalid');
    } else {
        answer1.classList.add('invalid');
    }
});
answer2.addEventListener('input', function() {
    if (alphabeticReg.test(answer2.value)) {
        answer2.classList.remove('invalid');
    } else {
        answer2.classList.add('invalid');
    }
});
password1.addEventListener('input', function() {
    if (passwordReg.test(password1.value)) {
        password1.classList.remove('invalid');
    } else {
        password1.classList.add('invalid');
    }
});
password2.addEventListener('input', function() {
    if (passwordReg.test(password2.value)) {
        password2.classList.remove('invalid');
    } else {
        password2.classList.add('invalid');
    }
});


/** 
    ` Checks if all input fields within a given form are filled.
*/
function areInputFieldsFilled( formId ) {
    // - Get all the input elements within the form
    const inputElements = document.querySelectorAll(`#${formId} input`);

    // - Loop through each input element and check if it has a value
    for( const inputElement of inputElements ) {
        if( !inputElement.value ) {
            return 0; 
        }
    }
    return 1; 
}