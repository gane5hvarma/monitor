const axios = require("axios");
const fs = require("fs");
const unableToRead = "Rudder-Monitor: Not able to read customer - urls from configMap";
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCustomerUrlMappings() {
    fs.readdirSync('/etc/urls/').forEach(file => {
        console.log(file);
    })
    fs.readFile('/etc/urls/urls.json', function (err, data) {
        if (err) {
            const response = alert(err.message, unableToRead);
        }
        else {
            return data
        }
    })
}

async function alert(message, entity) {
    const response = await axios.post(
        "https://alert.victorops.com/integrations/generic/20131114/alert/c0be7ebf-4087-4dc1-9034-0fa4b78cf1b3/rudderRecovery",
        {
            message_type: "CRITICAL",
            entity_id: entity,
            state_message: message,
        }
    );
    return response;
}


(async function () {
    let failedCustomers = [];
    mappings = getCustomerUrlMappings();
    console.log("fetch")
    console.log(mappings)
    if (mappings === undefined) {
        const response = alert("empty urls", unableToRead);
        return
    }
    for (let customer of Object.keys(mappings)) {
        let failed = true;
        for (i = 0; i < 5; i++) {
            try {
                const response = await axios.get(mappings[customer], {});
                console.log(response.data);
                if (
                    response.data["routingEvents"] &&
                    response.data["routingEvents"] == "TRUE"
                ) {
                    failed = false;
                    console.log("Reachable: " + customer);
                    break;
                }
            } catch (error) {
                await sleep(2000);
            }
        }
        if (failed) {
            failedCustomers.push(customer);
        }
    }

    if (failedCustomers.length > 0) {
        const failedCustomerString = failedCustomers.join("-");
        console.log("Failed for customers: " + failedCustomerString);
        entity = "Dataplane not reachable"
        const response = alert(failedCustomerString, entity)
        console.log(response.data);
    }
})();
