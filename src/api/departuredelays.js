const express = require('express');
const axios = require("axios")

const router = express.Router();
let cache;
function updateCache() {
    axios.get("https://api.tfl.gov.uk/line/mode/national-rail/status")
    .then(function (r) {
        cache = r.data;
        console.log("Updated Cache");
    })
    .catch(function (err) {
        console.log("Failed to update cache", err);
        console.log(cache)
        updateCache()
    });
}
setInterval(() => {
   updateCache()
}, 1000 * 30);

updateCache()
router.get('/:id', (req, res) => {
    const id = req.params.id
    const limit = req.query.limit
    console.log(id)
        axios.get(`https://huxley2.azurewebsites.net/departures/${id}/${limit}`).then(async function(response) {
            let services = response.data.trainServices
            if(services == null) {
                res.json({
                    "services": 0,
                    "delayedServices": 0,
                    "onTimeServices":0,
                    "operators": [],
                    "delayedOperators": [],
                    "mostServicesDelayed": false
                })
            } else {
                
            const totalServices = services.length
            let onTimeServices = 0;
            let delayedServices = 0;
            let operators = []
            let delayedOperators = []
            let mostServicesDelayed;
            let areOperatorsDelated;
        await Promise.all(services.map(async (e) => {
            if (e.etd !== "On time") {
                delayedServices++;
            } else {
                onTimeServices++;
            }
            if (!operators.includes(e.operator)) {
                operators.push(e.operator);
            }
            const isOpDelayed = await findDelays(e.operator);
            if (isOpDelayed === "Delays" && !delayedOperators.includes(e.operator)) {
                delayedOperators.push(e.operator);
            }
        }));

            console.log(`On time: ${onTimeServices}, Delayed: ${delayedServices}`)
            console.log(delayedOperators)
            if(delayedServices >= onTimeServices) {
                mostServicesDelayed = true
            } else mostServicesDelayed = false;
            if(delayedOperators.length) {
                areOperatorsDelated = true
            } else areOperatorsDelated = false;
            res.json({
                "services": totalServices,
                "delayedServices": delayedServices,
                "onTimeServices": onTimeServices,
                "operators": operators,
                "delayedOperators": delayedOperators,
                "mostServicesDelayed": mostServicesDelayed,
                "areOperatorsDelayed": areOperatorsDelated
            })
        }
            });

        })


async function findDelays(searchTerm) {
  try {
    // Create a mapping for special cases where the Operator in Huxley isn't the same as the operator in TFL's Status API
    // TODO: Test all TOCs for these cases
    const tocMapping = {
      "TransPennine Express": "First TransPennine Express",
      "CrossCountry": "Cross Country",
    };

    // Check if the searchTerm is a special case and map it
    const mappedSearchTerm = tocMapping[searchTerm] || searchTerm;
    const foundElement = cache.find((element) => {
      return element.name.toLowerCase().includes(mappedSearchTerm.toLowerCase());
    });

    if (foundElement) {
      if (foundElement.lineStatuses[0].statusSeverityDescription !== "Good Service") {
        return "Delays";
      } else {
        return "Fine";
      }
    } else {
      console.log("Element not found! [BUG] " + searchTerm);
      return "Element not found!";
    }
  } catch (error) {
    console.error("Error while fetching data:", error);
    return "Error";
  }
}
 
 
module.exports = router;
  