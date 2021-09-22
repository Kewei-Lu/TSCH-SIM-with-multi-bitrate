
import constants from './constants.mjs';
import config from './config.mjs';
import * as scheduler_orchestra from './scheduler_orchestra.mjs';
import * as scheduler_6tisch_min from './scheduler_6tisch_min.mjs';
import * as scheduler_lf from './scheduler_lf.mjs';
import * as log from './log.mjs';
import * as time from './time.mjs';
import * as simulator from './simulator.mjs';
import * as network from './network.mjs';
import * as rpl from './routing_rpl.mjs';

/* Select which scheduler to use */
let scheduler = scheduler_6tisch_min;
if (config.SCHEDULING_ALGORITHM === "Orchestra") {
    scheduler = scheduler_orchestra;
} else if (config.SCHEDULING_ALGORITHM === "LeafAndForwarder") {
    scheduler = scheduler_lf;
}

export class Duration_switcher{
    constructor(){
	this.bitrate_duration_map = {'5704': '1000',
                                     '10716': '250',
				     '29380': '50'
        };
        this.bitrate_duration_level = {'3': '5704',
                                     '2': '10716',
				     '1': '29380'
        };
	//this.current_index = 0;  // the phase of shifting, default: 0
	//this.current_slot_duration = config.DURATION_TO_CHANGE[this.current_index];
	//this.next_switch_time = config.CHANGE_TIME[this.current_index+1];
	this.network = null;
        //this.current_bitrate = this.bitrate_duration_map[config.DURATION_TO_CHANGE[this.current_index]];
	//this.current_bitrate = this.bitrate_duration_map[	      config.MAC_SLOT_DURATION_US];
        this.current_bitrate_level = config.BITRATE_LEVEL;  // the default bitrate
        this.current_bitrate = this.bitrate_duration_map[config.MAC_SLOT_DURATION_US];
}

    change_timeslot_duration(new_level){
	let new_duration =this.bitrate_duration_level[new_level];
        log.log(log.INFO,null,"Main",`new duration = ${new_duration}`);
	scheduler.orchestra_set_timings_after_first_time(new_duration);
	//rpl.initialize(this.network);  //
	//this.current_slot_duration = config.DURATION_TO_CHANGE[this.current_index+1];
	//this.aggregate_stats();  // collect status for slot duration before switch
        this.current_bitrate_level = new_level ;
        this.current_bitrate = this.bitrate_duration_map[this.bitrate_duration_level[this.current_bitrate_level]];
	//this.current_index += 1
	//this.current_bitrate = this.bitrate_duration_map[config.DURATION_TO_CHANGE[this.current_index]];
	log.log(log.INFO, null, "Main", `timeslot duration changed,current timeslot duration(changed) is ${new_duration} us,time.timeline.get_next_seconds() = ${time.timeline.get_next_seconds()},current_bitrate_level =${this.current_bitrate_level}`);
}

    whether_to_switch(){
			//log.log(log.INFO, null, "Main", `${time.timeline.get_next_useconds()}, ${config.CHANGE_TIME[this.current_index+1]}`);
	// log.log(log.INFO, null, "Main", `examing time`);
	if (this.current_index+1 <= config.CHANGE_TIME.length){
	    if (time.timeline.get_next_useconds() >=                  	1000000*config.CHANGE_TIME[this.current_index+1]){
                this.change_timeslot_duration();
            }
        }
    } 
    /* modified 4/7/2021 */
    /* to realize multi-timeslot duration */
    /* the stats for each timeslot duration must be printed before the switch */
    aggregate_stats(){
        this.network.aggregate_stats();
    }
	
    get_network(network){
        this.network = network;
    }

    return_current_index(){
	return this.current_index;
    }
}

//duration_switcher = new Duration_switcher();

