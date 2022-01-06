"use strict";

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
                    [["Options", "Votes"]].concat(data)
                ), chartOptions
            );
            chartEl.style.visibility = "visible";
        };
 
        try {
            drawChart(JSON.parse(POLL_VOTE_DATA_STRING));
        } catch (error) {
            // eh
        }
    });
    window.addEventListener("resize", function() {
        textFit(document.querySelector(".poll-title"), textFitOptions);
        document.querySelectorAll(".poll-option .poll-option-text").forEach(element => textFit(element, textFitOptions));
    });
}

if (document.readyState === "complete" || document.readyState === "loaded") domLoaded();
else document.addEventListener('DOMContentLoaded', domLoaded);

