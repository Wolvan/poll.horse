"use strict";

const POLL_REFRESH_INTERVAL = 5000;

const textFitOptions = {
    multiLine: true
};

let drawChart = () => { /* STUB */ };

function domLoaded() {
    textFit(document.querySelector(".poll-title"), textFitOptions);
    document.querySelectorAll(".poll-option .poll-option-text").forEach(element => textFit(element, textFitOptions));

    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(() => {
        const chartOptions = {
            backgroundColor: "transparent",
            legend: "none",
            chartArea: {
                width: "90%",
                height: "90%",
            }
        };
        const chartEl = document.getElementById('chart');
        const chart = new google.visualization.PieChart(chartEl);
        
        drawChart = data => {
            chart.draw(
                google.visualization.arrayToDataTable(
                    [["Options", "Votes"]].concat(data.sort((a, b) => b[1] - a[1]))
                ), chartOptions
            );
            chartEl.style.visibility = "visible";
        };
 
        try {
            drawChart(JSON.parse(window.atob(POLL_VOTE_DATA_STRING)));
        } catch (error) {
            // eh
        }
    });
    window.addEventListener("resize", function() {
        textFit(document.querySelector(".poll-title"), textFitOptions);
        document.querySelectorAll(".poll-option .poll-option-text").forEach(element => textFit(element, textFitOptions));
    });

    let prevResult = null;
    async function fetchNewestResults() {
        try {
            const response = await fetch(POLL_BACKEND_URL + "/_backend/api/poll-result/" + POLL_ID);
            const json = await response.json();
            if (json.error) throw new Error(json.error);
            const votes = json.votes;
            const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
            if (!prevResult || Object.entries(votes).some(([key, value]) => value !== prevResult[key])) {
                drawChart(Object.entries(votes));
                Object.entries(votes).forEach(([key, value]) => {
                    const el = document.querySelector("main .notepad .poll-option[option='" + key + "']");
                    if (!el) return;

                    el.querySelector(".poll-option-votes").innerText = value;
                    el.querySelector(".poll-bar-fill").style.width = totalVotes ? (value / totalVotes * 100) + "%" : "0%";
                    el.querySelector(".poll-bar-text").innerText = totalVotes ? Math.round(value / totalVotes * 100) : 0;
                });
                prevResult = votes;
            }
        } catch (error) {
            console.warn(error);
        }
        setTimeout(fetchNewestResults, POLL_REFRESH_INTERVAL);
    }
    setTimeout(fetchNewestResults, POLL_REFRESH_INTERVAL);
}

if (document.readyState === "complete" || document.readyState === "loaded") domLoaded();
else document.addEventListener('DOMContentLoaded', domLoaded);

