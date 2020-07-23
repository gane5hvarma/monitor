const axios = require("axios");
const fs = require("fs");

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCustomerUrlMappings() {
    fs.readFile('/etc/urls/urls.json', function (err, data) {
        if (err) {
            const response = alert(err.message, "Rudder-Monitor: Not able to read customer-urls from configMap");
            console.log(response.data);
        }
        else {
            return data
        }
    })
}

function alert(message, entity) {
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


