function round(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

function formatTime(decimalHours) {
    const totalMinutes = Math.round(decimalHours * 60);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getTimeInHours() {
    const hoursInput = document.getElementById("time-hours").value;
    const minutesInput = document.getElementById("time-minutes").value;

    const hours = hoursInput === "" ? 0 : Number(hoursInput);
    const minutes = minutesInput === "" ? 0 : Number(minutesInput);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return null;
    }

    if (hours < 0 || minutes < 0 || minutes >= 60) {
        return null;
    }

    return hours + minutes / 60;
}

function setTimeInputs(decimalHours) {
    const totalMinutes = Math.round(decimalHours * 60);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    document.getElementById("time-hours").value = hours;
    document.getElementById("time-minutes").value = minutes;
}

function showError(message) {
    const error = document.getElementById("error-message");

    error.textContent = message;
    error.style.display = "block";
}

function clearError() {
    const error = document.getElementById("error-message");

    error.textContent = "";
    error.style.display = "none";
}

function calculateNavigation() {

    clearError();

    const distanceInput = document.getElementById("distance").value;
    const groundspeedInput = document.getElementById("groundspeed").value;

    const distance = distanceInput === "" ? null : Number(distanceInput);
    const groundspeed = groundspeedInput === "" ? null : Number(groundspeedInput);

    const time = getTimeInHours();

    const distanceKnown = distance !== null;
    const groundspeedKnown = groundspeed !== null;

    const timeHoursInput =
        document.getElementById("time-hours").value;

    const timeMinutesInput =
        document.getElementById("time-minutes").value;

    const timeKnown =
        timeHoursInput !== "" || timeMinutesInput !== "";

    const knownValues =
        Number(distanceKnown) +
        Number(groundspeedKnown) +
        Number(timeKnown);

    if (knownValues < 2) {
        showError("Inserisci almeno due dei tre valori.");
        return;
    }

    if (distanceKnown && (!Number.isFinite(distance) || distance <= 0)) {
        showError("La distanza deve essere maggiore di 0.");
        return;
    }

    if (groundspeedKnown && (!Number.isFinite(groundspeed) || groundspeed <= 0)) {
        showError("La groundspeed deve essere maggiore di 0.");
        return;
    }

    if (timeKnown && (time === null || time <= 0)) {
        showError("Inserisci un tempo valido.");
        return;
    }

    let calculatedDistance = distance;
    let calculatedGroundspeed = groundspeed;
    let calculatedTime = time;

    let formula = "";

    if (!distanceKnown) {

        calculatedDistance =
            calculatedGroundspeed * calculatedTime;

        formula =
            `Distance = GS × Time<br><br>` +
            `Distance = ${round(calculatedGroundspeed)} × ${round(calculatedTime, 4)}<br>` +
            `Distance = <strong>${round(calculatedDistance)} NM</strong>`;

    } else if (!groundspeedKnown) {

        calculatedGroundspeed =
            calculatedDistance / calculatedTime;

        formula =
            `GS = Distance ÷ Time<br><br>` +
            `GS = ${round(calculatedDistance)} ÷ ${round(calculatedTime, 4)}<br>` +
            `GS = <strong>${round(calculatedGroundspeed)} kt</strong>`;

    } else if (!timeKnown) {

        calculatedTime =
            calculatedDistance / calculatedGroundspeed;

        formula =
            `Time = Distance ÷ GS<br><br>` +
            `Time = ${round(calculatedDistance)} ÷ ${round(calculatedGroundspeed)}<br>` +
            `Time = <strong>${formatTime(calculatedTime)}</strong>`;

    } else {

        calculatedDistance =
            calculatedGroundspeed * calculatedTime;

        formula =
            `Distance = GS × Time<br><br>` +
            `Distance = ${round(calculatedGroundspeed)} × ${round(calculatedTime, 4)}<br>` +
            `Distance = <strong>${round(calculatedDistance)} NM</strong>`;
    }

    document.getElementById("distance-result").textContent =
        round(calculatedDistance);

    document.getElementById("groundspeed-result").textContent =
        round(calculatedGroundspeed);

    document.getElementById("time-result").textContent =
        formatTime(calculatedTime);

    document.getElementById("decimal-time-result").textContent =
        round(calculatedTime, 4);

    document.getElementById("formula-text").innerHTML = formula;
}

document
    .getElementById("calculate-button")
    .addEventListener("click", calculateNavigation);

document.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        calculateNavigation();
    }

});
