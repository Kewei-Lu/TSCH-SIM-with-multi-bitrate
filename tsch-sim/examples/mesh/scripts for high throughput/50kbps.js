// based on a 7200s simulation
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

/*function original_packet(state) {
    const node_number = 8;  // number of nodes
	    for (let packet_source of state.packet_sources){
		packet_source.period = origin_period;    
                state.log.log(state.log.INFO, null, "User", `set original packet period = ${state.packet_sources[0].period}`);
	    }
}
*/
let callbacks = {};
function purly_check_stats(state) {
    state.network.aggregate_stats();
    const network = state.network;
    state.log.log(state.log.INFO, null, "User", `app-packet-received in this period = ${network.stats_app_num_endpoint_rx_period}
`);
state.log.log(state.log.INFO, null, "User", `latency in this period = ${network.stats_app_latencies_period.avg()}
`);
    return;
}



function change_period_30(state) {
    const node_number = 6;  // number of nodes
	    for (let packet_source of state.packet_sources){
		packet_source.period = 30;    
                state.log.log(state.log.INFO, null, "User", `changing packets generation period, current period = ${state.packet_sources[0].period},current time = ${state.timeline.seconds} seconds`);

	    }
    return;
}

function change_period_2(state) {
    const node_number = 6;  // number of nodes
	    for (let packet_source of state.packet_sources){
		packet_source.period = 2;    
                state.log.log(state.log.INFO, null, "User", `changing packets generation period, current period = ${state.packet_sources[0].period},current time = ${state.timeline.seconds} seconds`);

	    }
    return;
}



function change_bitrate_to_1000(state) {
    const node_number = 6;  // number of nodes
    const switcher = state.timeline.timeslot_switcher;
    const network = state.network;
    switcher.change_timeslot_duration(3);
    state.network.change_bit_level = 1;  // reset the level
    network.last_change_time_in_asn = state.timeline.asn;
    network.last_change_time_in_sec = state.timeline.seconds;
    return;
}

function change_bitrate_to_50(state) {
    const node_number = 6;  // number of nodes
    const switcher = state.timeline.timeslot_switcher;
    const network = state.network;
    switcher.change_timeslot_duration(1);
    state.network.change_bit_level = 1;  // reset the level
    network.last_change_time_in_asn = state.timeline.asn;
    network.last_change_time_in_sec = state.timeline.seconds;
    return;
}

function collect_stats_periodcally(state){
// collect stats every 50s
    const network = state.network;
    if (state.timeline.seconds - network.last_collect_stats_time >= 50){
    network.aggregate_stats();
    
    state.log.log(state.log.INFO, null, "User", `begin to collect stats, current time = ${state.timeline.seconds}s`);
    const total_app_packets = network.stats_app_num_endpoint_rx + network.stats_app_num_lost;
    const pdr = total_app_packets ? 100.0 * (1.0 - (network.stats_app_num_lost / total_app_packets)) : 0.0;
    const last_change_time = network.last_change_time_in_sec;
    state.log.log(state.log.INFO, null, "User", `pdr=${pdr},current_level=${network.change_bit_level}`);
    state.log.log(state.log.INFO, null, "User", `app-packet-received in this period = ${network.stats_app_num_endpoint_rx_period}
`);
    state.log.log(state.log.INFO, null, "User", `state.timeline.seconds= ${state.timeline.seconds},last_change_time = ${(last_change_time)}
`);
    state.log.log(state.log.INFO, null, "User", `app-packet-received per sec = ${network.stats_app_num_endpoint_rx_period/(state.timeline.seconds - network.last_collect_stats_time)}
`);
    state.log.log(state.log.INFO, null, "User", `latency in this period = ${network.stats_app_latencies_period.avg()}
`);
    network.last_collect_stats_time = state.timeline.seconds;
    }
return;
}


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

callbacks[74880] = change_period_2;  // @ 2200s
//callbacks[74882] = change_bitrate_to_1000;
callbacks[653421] = change_period_30;  // @ 5500s
//callbacks[653423] = change_bitrate_to_50;

for (let i = 1700; i < state.config.SIMULATION_DURATION_SEC * 180; i += 17) {
  callbacks[i] = collect_stats_periodcally;
}

return callbacks;
