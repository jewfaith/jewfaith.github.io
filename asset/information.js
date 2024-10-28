'use strict';
emailjs.init("gmHYV6xS-j71vAGl9");

const SERVICE_ID = "service_z6setbs";
const TEMPLATE_ID = "template_yr4jt0e";

async function sendEmail(name, mail, subject, message) {
    const templateParams = { name, mail, subject, message };
    try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
        return true;
    } catch (error) {
        console.error("Email error:", error);
        return false;
    }
}

async function submitForm(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const name = formData.get("name");
    const mail = formData.get("mail");
    const subject = formData.get("subject");
    const message = formData.get("message");

    if (!validateFormInputs(name, mail, subject, message)) return;

    const result = await sendEmail(name, mail, subject, message);
    showFeedback(result ? "Operation successful" : "Operation failed", "error");

    if (result) {
        form.reset();
    }
}

function showFeedback(message, type) {
    const advice = document.querySelector(".advice");
    advice.textContent = message;
    advice.className = `advice ${type}`;

    setTimeout(() => {
        advice.textContent = "";
        advice.className = "advice";
    }, 5000);
}

function validateFormInputs(name, mail, subject, message) {
    const suspiciousChars = /[<>;"'/()%&]/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!name || !mail || !subject || !message) {
        showFeedback("Complete fields", "error");
        return false;
    }

    if (suspiciousChars.test(name)) {
        showFeedback("Invalid name", "error");
        document.getElementById("name").value = "";
        return false;
    }

    if (!emailRegex.test(mail) || suspiciousChars.test(mail)) {
        showFeedback("Invalid email", "error");
        document.getElementById("mail").value = "";
        return false;
    }

    if (suspiciousChars.test(subject)) {
        showFeedback("Invalid subject", "error");
        document.getElementById("subject").value = "";
        return false;
    }

    if (suspiciousChars.test(message)) {
        showFeedback("Invalid message", "error");
        document.getElementById("message").value = "";
        return false;
    }

    return true;
}
