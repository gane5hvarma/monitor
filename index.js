const axios = require("axios");
const fs = require("fs");
const unableToRead = "Rudder-Monitor: Not able to read customer - urls from configMap";
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCustomerUrlMappings() {
    try {
        let data = fs.readFileSync('/etc/urls/urls.json', { encoding: "utf-8", flag: "r" })
        return JSON.parse(data)
    }
    catch (error) {
        console.log(error)
    }
}

async function alert(message, entity) {
    const response = await axios.post(
        // c0be7ebf-4087-4dc1-9034-0fa4b78cf1b3
        "https://alert.victorops.com/integrations/generic/20131114/alert/1/rudderRecovery",
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
    let mappings = getCustomerUrlMappings();
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
