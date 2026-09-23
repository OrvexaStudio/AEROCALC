"use strict";

/*
 * AERO CALC
 * Wind Triangle Engine
 *
 * Convention:
 * - Angles are TRUE degrees.
 * - Wind direction in METAR/aviation convention is the direction
 *   FROM which the wind is coming.
 * - TAS and wind speed are expressed in knots.
 *
 * Vector convention:
 * 0° = North
 * 90° = East
 * 180° = South
 * 270° = West
 */

// ------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

function normalize360(angle) {
    let result = angle % 360;

    if (result < 0) {
        result += 360;
    }

    return result;
}

function round(value, decimals = 1) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

function formatAngle(value) {
    return `${round(normalize360(value), 1)}°`;
}

function formatSigned(value, unit = "kt") {
    const rounded = round(value, 1);
    const sign = rounded > 0 ? "+" : "";

    return `${sign}${rounded} ${unit}`;
}

// ------------------------------------------------------------
// DOM
// ------------------------------------------------------------

const tcInput = document.getElementById("tc");
const tasInput = document.getElementById("tas");
const windDirectionInput = document.getElementById("wind-direction");
const windSpeedInput = document.getElementById("wind-speed");

const calculateButton = document.getElementById("calculate-button");

const errorMessage = document.getElementById("error-message");

const emptyResults = document.getElementById("empty-results");
const results = document.getElementById("results");

const headingResult = document.getElementById("heading-result");
const gsResult = document.getElementById("gs-result");
const wcaResult = document.getElementById("wca-result");
const crosswindResult = document.getElementById("crosswind-result");
const headwindResult = document.getElementById("headwind-result");
const windAngleResult = document.getElementById("wind-angle-result");
const formulaText = document.getElementById("formula-text");

// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
}

function clearError() {
    errorMessage.textContent = "";
    errorMessage.style.display = "none";
}

function getNumber(input) {
    const value = Number(input.value);

    if (!Number.isFinite(value)) {
        return null;
    }

    return value;
}

function validateInputs() {
    const tc = getNumber(tcInput);
    const tas = getNumber(tasInput);
    const windDirection = getNumber(windDirectionInput);
    const windSpeed = getNumber(windSpeedInput);

    if (
        tc === null ||
        tas === null ||
        windDirection === null ||
        windSpeed === null
    ) {
        showError("Inserisci tutti i valori richiesti.");
        return null;
    }

    if (tas <= 0) {
        showError("La TAS deve essere maggiore di 0 kt.");
        return null;
    }

    if (windSpeed < 0) {
        showError("La velocità del vento non può essere negativa.");
        return null;
    }

    if (tc < 0 || tc > 360) {
        showError("Il True Course deve essere compreso tra 0° e 360°.");
        return null;
    }

    if (windDirection < 0 || windDirection > 360) {
        showError("La direzione del vento deve essere compresa tra 0° e 360°.");
        return null;
    }

    return {
        tc: normalize360(tc),
        tas,
        windDirection: normalize360(windDirection),
        windSpeed
    };
}

// ------------------------------------------------------------
// WIND TRIANGLE
// ------------------------------------------------------------

function calculateWindTriangle(data) {

    const {
        tc,
        tas,
        windDirection,
        windSpeed
    } = data;

    /*
     * The wind angle is the angle between:
     *
     * aircraft desired track
     * and
     * the direction FROM which the wind comes.
     *
     * Example:
     *
     * TC = 240°
     * WD = 280°
     *
     * difference = 40°
     */

    let windAngle = normalize360(windDirection - tc);

    if (windAngle > 180) {
        windAngle -= 360;
    }

    /*
     * Crosswind component.
     *
     * Positive value means wind comes from the right
     * of the desired track.
     *
     * Negative value means wind comes from the left.
     */

    const crosswind =
        windSpeed * Math.sin(toRadians(windAngle));

    /*
     * Longitudinal component.
     *
     * Positive = headwind
     * Negative = tailwind
     */

    const headwind =
        windSpeed * Math.cos(toRadians(windAngle));

    /*
     * Wind correction angle.
     *
     * From the wind triangle:
     *
     * sin(WCA) =
     * crosswind / TAS
     *
     * Therefore:
     *
     * WCA = asin(crosswind / TAS)
     */

    let wcaRadians;

    const ratio = crosswind / tas;

    /*
     * Numerical protection.
     *
     * Due to floating point calculations,
     * a value can very slightly exceed +/-1.
     */

    const safeRatio = Math.max(
        -1,
        Math.min(1, ratio)
    );

    wcaRadians = Math.asin(safeRatio);

    const wca = toDegrees(wcaRadians);

    /*
     * True Heading.
     *
     * If wind comes from the right,
     * aircraft must correct toward the right.
     *
     * If wind comes from the left,
     * correction is toward the left.
     */

    const heading = normalize360(tc + wca);

    /*
     * Groundspeed.
     *
     * Exact vector solution:
     *
     * GS =
     * TAS × cos(WCA) + head/tailwind component
     *
     * With headwind positive in our convention:
     *
     * GS =
     * TAS × cos(WCA) - headwind
     */

    const groundspeed =
        tas * Math.cos(wcaRadians) - headwind;

    /*
     * Sanity check.
     */

    if (!Number.isFinite(groundspeed) || groundspeed <= 0) {
        throw new Error(
            "Il vento è troppo forte rispetto alla TAS per ottenere una GS positiva."
        );
    }

    return {
        tc,
        tas,
        windDirection,
        windSpeed,
        windAngle,
        crosswind,
        headwind,
        wca,
        heading,
        groundspeed
    };
}

// ------------------------------------------------------------
// DISPLAY
// ------------------------------------------------------------

function displayResults(data) {

    emptyResults.classList.add("hidden");
    results.classList.remove("hidden");

    headingResult.textContent =
        round(normalize360(data.heading), 1);

    gsResult.textContent =
        round(data.groundspeed, 1);

    wcaResult.textContent =
        `${data.wca >= 0 ? "+" : ""}${round(data.wca, 1)}°`;

    crosswindResult.textContent =
        formatSigned(data.crosswind);

    /*
     * Headwind positive.
     * Tailwind negative.
     */

    if (Math.abs(data.headwind) < 0.05) {

        headwindResult.textContent = "0.0 kt";

    } else if (data.headwind > 0) {

        headwindResult.textContent =
            `${round(data.headwind, 1)} kt headwind`;

    } else {

        headwindResult.textContent =
            `${round(Math.abs(data.headwind), 1)} kt tailwind`;
    }

    windAngleResult.textContent =
        `${round(Math.abs(data.windAngle), 1)}°`;

    /*
     * Show the mathematical method.
     */

    const crosswindValue = round(data.crosswind, 2);
    const tasValue = round(data.tas, 2);
    const wcaValue = round(data.wca, 2);
    const gsValue = round(data.groundspeed, 2);

    formulaText.innerHTML = `
        Δwind = WD − TC<br>
        Δwind = ${round(data.windDirection, 1)}° − ${round(data.tc, 1)}°
        = ${round(data.windAngle, 1)}°<br><br>

        Crosswind = WV × sin(Δwind)<br>
        Crosswind = ${round(data.windSpeed, 1)}
        × sin(${round(data.windAngle, 1)}°)
        = ${crosswindValue} kt<br><br>

        WCA = asin(Crosswind / TAS)<br>
        WCA = asin(${crosswindValue} / ${tasValue})
        = ${wcaValue}°<br><br>

        TH = TC + WCA<br>
        TH = ${round(data.tc, 1)}°
        ${data.wca >= 0 ? "+" : "−"}
        ${Math.abs(wcaValue)}°
        = ${round(data.heading, 1)}°T<br><br>

        GS = TAS × cos(WCA) − Headwind<br>
        GS = ${gsValue} kt
    `;
}

// ------------------------------------------------------------
// MAIN CALCULATION
// ------------------------------------------------------------

function runCalculation() {

    clearError();

    const data = validateInputs();

    if (!data) {
        return;
    }

    try {

        const result = calculateWindTriangle(data);

        displayResults(result);

    } catch (error) {

        showError(error.message);

        emptyResults.classList.remove("hidden");
        results.classList.add("hidden");
    }
}

// ------------------------------------------------------------
// EVENTS
// ------------------------------------------------------------

calculateButton.addEventListener(
    "click",
    runCalculation
);

/*
 * Pressing ENTER inside an input
 * also performs the calculation.
 */

[
    tcInput,
    tasInput,
    windDirectionInput,
    windSpeedInput
].forEach(input => {

    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                runCalculation();
            }

        }
    );

});
