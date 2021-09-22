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
let burst_period = 0.3;

/*function original_packet(state) {
    const node_number = 8;  // number of nodes
	    for (let packet_source of state.packet_sources){
		packet_source.period = origin_period;    
                state.log.log(state.log.INFO, null, "User", `set original packet period = ${state.packet_sources[0].period}`);
	    }
}
*/

function burst_packet(state) {
    const node_number = 8;  // number of nodes
	    for (let packet_source of state.packet_sources){
		packet_source.period = burst_period;    
                state.log.log(state.log.INFO, null, "User", `changing packets generation period, current period = ${state.packet_sources[0].period},current time = ${state.timeline.seconds} seconds`);

	    }
    return;
}
// TODO: add a guard window 
function check_stats(state) {
    const bitrate_duration_map = {'5704': '1000',
                                     '10716': '250',
				     '29380': '50',
                                     '156900': '8',
                                     '1020500': '1.2'
        };
    const consistent_increment = 5;  // if pdr gets lower for 5 consistent check, then it will call the change function.
    const threshold = 60;  // percentage
    const node_number = 8;  // number of nodes
    const network = state.network;
    network.aggregate_stats();
    const total_app_packets = network.stats_app_num_endpoint_rx + network.stats_app_num_lost;
    const pdr = total_app_packets ? 100.0 * (1.0 - (network.stats_app_num_lost / total_app_packets)) : 0.0;
    const switcher = state.timeline.timeslot_switcher;  // current bitrate
    state.log.log(state.log.INFO, null, "User", `pdr=${pdr},current_level=${switcher.current_bitrate_level}`);
    if (pdr < threshold && switcher.current_bitrate_level < 4){
        state.log.log(state.log.INFO, null, "User", `need to change`);
        switcher.change_timeslot_duration(switcher.current_bitrate_level+1);
}
    return;
}
callbacks[2000] = burst_packet;  // change period at asn = 2000

// check stats for every 500 slotframes (500*17=8500)
for (let i = 10000; i < state.config.SIMULATION_DURATION_SEC * 100; i += 8500) {
    callbacks[i] = check_stats;
}
/* Set the callbacks to be executed during the simulation */
return callbacks;
