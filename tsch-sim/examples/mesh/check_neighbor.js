// based on a 3600s simulation
/*
*  - is_running - Boolean flag, if set to true, the simulator will terminate
*  - network - network structure, keeps track of nodes and links
*  - timeline - has `seconds` and `asn` member variables
*  - scheduler - Orchestra or other
*  - routing - RPL or other
*  - config - configuration values from config file and the default config
*  - log - logging module
*/

/*
simulate a scenario where at the beginning the generation period is low
after some while, it will experience a high generation period
after that, it come back to normal again
*/
let callbacks = {};
let origin_period = 15;
let burst_period = 5;

/*function original_packet(state) {
    const node_number = 8;  // number of nodes
	    for (let packet_source of state.packet_sources){
		packet_source.period = origin_period;    
                state.log.log(state.log.INFO, null, "User", `set original packet period = ${state.packet_sources[0].period}`);
	    }
}
*/
function check_neighbor(state) {
    for (const [id,node] of state.network.nodes){
        if (node.routing.preferred_parent){
        state.log.log(state.log.INFO, null, "User", `node id = ${id}, parent = ${node.routing.preferred_parent.neighbor.id}`);
        } else {
            state.log.log(state.log.INFO, null, "User", `node id = ${id}, no parent`);
        }
    }
    return;
}


for (let i = 20000; i < state.config.SIMULATION_DURATION_SEC * 180; i += 17000) {
  callbacks[i] = check_neighbor;
}


/* Set the callbacks to be executed during the simulation */
return callbacks;
