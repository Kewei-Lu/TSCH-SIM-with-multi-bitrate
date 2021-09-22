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
let callbacks = {};
let origin_period = 30;
let burst_period = 12;

/*function original_packet(state) {
    const node_number = 8;  // number of nodes
	    for (let packet_source of state.packet_sources){
		packet_source.period = origin_period;    
                state.log.log(state.log.INFO, null, "User", `set original packet period = ${state.packet_sources[0].period}`);
	    }
}
*/
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

function change_period_12(state) {
    const node_number = 6;  // number of nodes
	    for (let packet_source of state.packet_sources){
		packet_source.period = 12;    
                state.log.log(state.log.INFO, null, "User", `changing packets generation period, current period = ${state.packet_sources[0].period},current time = ${state.timeline.seconds} seconds`);

	    }
    return;
}

function change_period_8(state) {
    const node_number = 6;  // number of nodes
	    for (let packet_source of state.packet_sources){
		packet_source.period = 8;    
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



function recover_period(state) {
    const node_number = 6;  // number of nodes
	    for (let packet_source of state.packet_sources){
		packet_source.period = origin_period;    
                state.log.log(state.log.INFO, null, "User", `changing packets generation period, current period = ${state.packet_sources[0].period},current time = ${state.timeline.seconds} seconds`);

	    }
    return;
}


function check_stats(state) {
    const bitrate_duration_map = { '1000':'5704',
                                     '250': '10716',
				     '50':'29380'
        };
    const bitrate_threshold = {'5704':5,
                               '10716':10,
                               '29380':15
        };
    const consistent_increment = 1;  // if pdr gets lower for 5 consistent check, then it will call the change function.
    const threshold = 80;  // percentage
    const node_number = 8;  // number of nodes
    const network = state.network;
    const guard_window = 2550; // in the unit of asn,1700 = 100 slotframes, during which the processer will not proceed check action
    const switcher = state.timeline.timeslot_switcher;  // current bitrate
    const current_period = state.packet_sources[0].period;
    const current_bitrate = switcher.current_bitrate;
    const current_bitrate_threshold = bitrate_threshold[bitrate_duration_map[current_bitrate]]; // the threshold of current bitrate

    const total_app_packets = network.stats_app_num_endpoint_rx + network.stats_app_num_lost;
    const pdr = total_app_packets ? 100.0 * (1.0 - (network.stats_app_num_lost / total_app_packets)) : 0.0;

    // when change level has not reached the required level, simply increase the level by 1 to increase the robostness(avoid over sensitive)
if (state.timeline.asn - network.last_change_time_in_asn >= guard_window){
    // rise up the speed
    if (current_period <= current_bitrate_threshold && network.change_bit_level < consistent_increment){
        state.network.change_bit_level++;
        state.log.log(state.log.INFO, null, "User", `more frequent than the threshold, increase change_bit_level,current level=${network.change_bit_level}`);

    // need to change immediately
    } else if (current_period <= current_bitrate_threshold  && network.change_bit_level == consistent_increment){
        if (switcher.current_bitrate_level < 3){
		    state.log.log(state.log.INFO, null, "User", `need to change immediately`);
		    switcher.change_timeslot_duration(switcher.current_bitrate_level+1);
		    state.network.change_bit_level = 1;  // reset the level
                    network.last_change_time_in_asn = state.timeline.asn;
                    network.last_change_time_in_sec = state.timeline.seconds;
        } else {
            state.log.log(state.log.INFO, null, "User", `has reached the maximum speed = switcher.current_bitrate_level`);
        }
    // when pdr meet the requirement, level - 1
    } 

    // slow down the speed
    if (current_period > current_bitrate_threshold + 5 && network.change_bit_level > 1){
        state.network.change_bit_level-- ;
        state.log.log(state.log.INFO, null, "User", `less frequent than the threshold, decrease change_bit_level,current level=${network.change_bit_level}`);

    // need to change immediately
    } else if (current_period > current_bitrate_threshold + 5  && network.change_bit_level <= 1){
        if (switcher.current_bitrate_level > 1){
		    state.log.log(state.log.INFO, null, "User", `need to change immediately`);
		    switcher.change_timeslot_duration(switcher.current_bitrate_level-1);
		    state.network.change_bit_level = 1;  // reset the level
                    network.last_change_time_in_asn = state.timeline.asn;
                    network.last_change_time_in_sec = state.timeline.seconds;
        } else {
            state.log.log(state.log.INFO, null, "User", `has reached the minimum speed = switcher.current_bitrate_level`);
        }
    // when pdr meet the requirement, level - 1
    } 
} else {
    state.log.log(state.log.INFO, null, "User", `in guard window, won't do anything`);
}
    return;
}


function collect_stats(state){
    const network = state.network;
    network.aggregate_stats();
    const total_app_packets = network.stats_app_num_endpoint_rx + network.stats_app_num_lost;
    const pdr = total_app_packets ? 100.0 * (1.0 - (network.stats_app_num_lost / total_app_packets)) : 0.0;
    const last_change_time = network.last_change_time_in_sec;
    state.log.log(state.log.INFO, null, "User", `pdr=${pdr},current_level=${network.change_bit_level}`);
    state.log.log(state.log.INFO, null, "User", `app-packet-received in this period = ${network.stats_app_num_endpoint_rx_period}
`);
state.log.log(state.log.INFO, null, "User", `state.timeline.seconds= ${state.timeline.seconds},last_change_time = ${(last_change_time)}
`);
    state.log.log(state.log.INFO, null, "User", `app-packet-received per sec = ${network.stats_app_num_endpoint_rx_period/(state.timeline.seconds - last_change_time)}
`);
state.log.log(state.log.INFO, null, "User", `latency in this period = ${network.stats_app_latencies_period.avg()}
`);
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
// clear out warm up period
//callbacks[17000] = collect_stats;
//    timeslot = 29380us                     //
//callbacks[40801] = collect_stats;
callbacks[40802] = change_period_12;  // @ 1198.73s
callbacks[40803] = check_stats;
//callbacks[40804] = check_neighbor;
//  timeslot = 10716us // 
//callbacks[134118] = collect_stats;  // change period at asn = 8500 = 17 * 500
callbacks[134119] = change_period_8;  // @ 2200s
callbacks[134120] = check_stats; 
//callbacks[134121] = check_neighbor;
//  timeslot = 5704us // 
//callbacks[572406] = collect_stats;
callbacks[572408] = change_period_12;  // @ 4700s
callbacks[572409] = check_stats;
//callbacks[572409] = check_neighbor;
//  timeslot = 10716us // 
//callbacks[665726] = collect_stats;
callbacks[665727] = change_period_30;  // @5700s
callbacks[665728] = check_stats;         //665728 for instant, 680000 for a 2'30 delay
//callbacks[665729] = check_neighbor;
//  timeslot = 29380us // 
//callbacks[245060] = collect_stats;  // raw original speed = 50kbps
//callbacks[716783] = collect_stats; // optimized @ 7200s

// check stats for every 500 slotframes (500*17=8500)
for (let i = 1700; i < state.config.SIMULATION_DURATION_SEC * 180; i += 17) {
  callbacks[i] = collect_stats_periodcally;
}
/*for (let i = 5100; i < state.config.SIMULATION_DURATION_SEC * 180; i += 5100) {
  callbacks[i] = check_stats;
}*/

/* Set the callbacks to be executed during the simulation */
return callbacks;
/*function check_stats(state) {
    const bitrate_duration_map = {'5704': '1000',
                                     '10716': '250',
				     '29380': '50'}
        };
    const consistent_increment = 5;  // if pdr gets lower for 5 consistent check, then it will call the change function.
    const threshold = 80;  // percentage
    const node_number = 8;  // number of nodes
    const network = state.network;
    network.aggregate_stats();
    const total_app_packets = network.stats_app_num_endpoint_rx + network.stats_app_num_lost;
    const pdr = total_app_packets ? 100.0 * (1.0 - (network.stats_app_num_lost / total_app_packets)) : 0.0;
    const guard_window = 10200; // in the unit of asn,1700 = 100 slotframes, during which the processer will not proceed check action
    const switcher = state.timeline.timeslot_switcher;  // current bitrate
    state.log.log(state.log.INFO, null, "User", `pdr=${pdr},current_level=${network.change_bit_level}`);

    // when change level has not reached the required level, simply increase the level by 1 to increase the robostness(avoid over sensitive)
if (state.timeline.asn - network.last_change_time >= guard_window){
    if (pdr < threshold && network.change_bit_level < 4){
        state.network.change_bit_level++;
        state.log.log(state.log.INFO, null, "User", `below the required threshold, increase change_bit_level,current level=${network.change_bit_level}`);

    // need to change immediately
    } else if (pdr < threshold && network.change_bit_level == 4){
        if (switcher.current_bitrate_level < 2){
		    state.log.log(state.log.INFO, null, "User", `need to change immediately`);
		    switcher.change_timeslot_duration();
		    state.network.change_bit_level = 1;  // reset the level
                    network.last_change_time = state.timeline.asn
        } else {
            state.log.log(state.log.INFO, null, "User", `has reached the maximum speed = switcher.current_bitrate_level`);
        }
    // when pdr meet the requirement, level - 1
    } else {
        state.log.log(state.log.INFO, null, "User", `right now the pdr has reached the threshold`);
        if (state.network.change_bit_level == 1){
            state.network.change_bit_level = 1;
        } else {
            state.network.change_bit_level--;
        }
    }
} else {
    state.log.log(state.log.INFO, null, "User", `in guard window, won't do anything`);
}
    return;
}*/
