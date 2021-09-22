import * as time from './time.mjs';
import * as log from './log.mjs';

class Energy_model{
    constructor(){
	Energy_model.prototype.toString = function ToString() {return 'this is energy model' ;}
        this.regression_rx_bc = [0.258910335917, 21.816774572];
	this.regression_rx_uc = [0.244439144648, 38.3440721024];
	this.regression_tx_bc = [0.399234139478, 13.67152911];
	this.regression_tx_uc = [0.345405572975, 36.5460914801];
	this.CURRENTS_MA = {
	    cpu: 2.703,
	    lpm: 1.335,
	    deep_lpm: 0.016,
	    rx: 7.0
	};
	this.TSCH_SLOT_SIZE_USEC        = null;
	this.TSCH_SLOT_RX_WAIT_USEC     = null;
	this.TSCH_SLOT_ACK_WAIT_USEC     = null;
	this.TSCH_BYTE_USEC                = null;

	this.PREAMBLE_SIZE = 4;
	this.SFD_SIZE = 1;
	this.LENGTH_SIZE = 1;
	this.FCS_SIZE = 2;
	this.PHY_OVERHEAD_BYTES = this.PREAMBLE_SIZE + this.SFD_SIZE +  this.LENGTH_SIZE + this.FCS_SIZE;
	this.MAC_ACK_SIZE = 17;
        this.PHY_ACK_SIZE = this.MAC_ACK_SIZE + this.PHY_OVERHEAD_BYTES;

/* current consumption microcoulumbs in a scanning slot (radio always on), slot size 10 milliseconds */
	
    }

    update_slot_timing(timeslot_switcher){
        /* 1000kbps */
        //log.log(log.INFO, null, "energy_model", `timeslot_switcher.current_bitrate_level = ${timeslot_switcher.current_bitrate_level} `);
	if (timeslot_switcher.current_bitrate_level == 3){
	energy_model.TSCH_SLOT_SIZE_USEC        = 5704;
	energy_model.TSCH_SLOT_RX_WAIT_USEC     = 2240;
	energy_model.TSCH_SLOT_ACK_WAIT_USEC     = 440;
	energy_model.TSCH_BYTE_USEC                = 8;

	/* 250kbps */
	} else if(timeslot_switcher.current_bitrate_level == 2) {
	energy_model.TSCH_SLOT_SIZE_USEC       = 10716;
	energy_model.TSCH_SLOT_RX_WAIT_USEC     = 2360;
	energy_model.TSCH_SLOT_ACK_WAIT_USEC     = 560;
	energy_model.TSCH_BYTE_USEC               = 32;

	/* 50kbps */
	} else if(timeslot_switcher.current_bitrate_level == 1) {
	energy_model.TSCH_SLOT_SIZE_USEC       = 29380;
	energy_model.TSCH_SLOT_RX_WAIT_USEC     = 3000;
	energy_model.TSCH_SLOT_ACK_WAIT_USEC    = 1200;
	energy_model.TSCH_BYTE_USEC              = 160;

	/* default */
	} else {
	energy_model.TSCH_SLOT_SIZE_USEC    = 10000;
	energy_model.TSCH_SLOT_RX_WAIT_USEC    = 2200;
	energy_model.TSCH_SLOT_ACK_WAIT_USEC   = 400;
	energy_model.TSCH_BYTE_USEC             = 32;
        }
	this.SCANNING_SLOT_UC = this.CURRENTS_MA.rx *   energy_model.TSCH_SLOT_SIZE_USEC / 1000.0;
	//log.log(log.INFO, null, "energy_model", `update finish, ${this.SCANNING_SLOT_UC} `);
    }
    get_packet_charges_uc_per_size(regression, stats) {
        let result = 0;
        for (let i = 0; i < stats.length; ++i) {
        /* no need to account for the extra PHY size as the regressions are based on empirical measurements */
            result += stats[i] * (i * regression[0] + regression[1]);
        }
        return result;
        }

	get_packet_charges_uc() {
    	    return {
		stats_slots_rx_scanning: function(stats) { 		
return stats * energy_model.SCANNING_SLOT_UC },
		stats_slots_rx_idle: function(stats) { return (stats * energy_model.regression_rx_bc[1]) },
		stats_slots_rx_packet: function(stats) { return energy_model.get_packet_charges_uc_per_size(this.regression_rx_bc, stats) },
		stats_slots_rx_packet_tx_ack: function(stats) { return energy_model.get_packet_charges_uc_per_size(this.regression_rx_uc, stats) },
		stats_slots_tx_packet: function(stats) { return energy_model.get_packet_charges_uc_per_size(this.regression_tx_bc, stats) },
		stats_slots_tx_packet_rx_ack: function(stats) { return energy_model.get_packet_charges_uc_per_size(this.regression_tx_uc, stats) },
	    };
	
    }

	from_mc_to_mah(x)
	    {
	        return x / 3600.0;
	    }

	estimate_charge_uc(slot_stats)
            {
                const packet_charges_uc = this.get_packet_charges_uc();

                const result = {};
                let total = 0;
                for (const key in packet_charges_uc) {
		//log.log(log.INFO, null, "check energy_model",	`key= `+ key);
		//log.log(log.INFO, null, "check energy_model",	`value= `+ packet_charges_uc[key]);
		//log.log(log.INFO, null, "check energy_model",	`slot_stats `+ slot_stats[key]);
                    const charge = packet_charges_uc[key](slot_stats[key]);
                    result[key] = charge;
                    total += charge;
                }
                result.total = total;
		//log.log(log.INFO, null, "energy_model",	`SCANNING_SLOT_UC `+ energy_model.SCANNING_SLOT_UC);
                result.scanning = this.SCANNING_SLOT_UC * slot_stats.stats_slots_rx_scanning;
		//log.log(log.INFO, null, "energy_model",	`result.scanning `+ result.scanning);
                return result;
            }

        estimate_charge_mc(slot_stats)
            {
                const packet_charges_uc = this.get_packet_charges_uc();
                const result = this.estimate_charge_uc(slot_stats);
                for (const key in packet_charges_uc) {
                    result[key] = from_uc_to_mc(result[key]);
                }
                result.total = from_uc_to_mc(result.total);
                result.scanning = from_uc_to_mc(result.scanning);
                return result;
        }

        estimate_charge_mah(slot_stats)
            {
                const packet_charges_uc = this.get_packet_charges_uc();
                const result = this.estimate_charge_mc(slot_stats);
                for (const key in packet_charges_uc) {
                    result[key] = this.from_mc_to_mah(result[key]);
                }
                result.total = this.from_mc_to_mah(result.total);
                result.scanning = this.from_mc_to_mah(result.scanning);
                return result;
            }

        estimate_duty_cycle(stats)
            {
                const total_usec = time.timeline.seconds * 1000000;
                if (!total_usec) {
                    return {
                        scanning: 0,
                        tx: 0,
                        rx: 0,
                        total: 0,
                    };
                }

                let rx_usec = 0;
                let tx_usec = 0;
                const scanning_usec = stats.stats_slots_rx_scanning * this.TSCH_SLOT_SIZE_USEC;
	    rx_usec += scanning_usec;
	    rx_usec += stats.stats_slots_rx_idle * this.TSCH_SLOT_RX_WAIT_USEC;
                let detail = {'rx_bc':0,
                              'rx_uc':0,
                              'tx_bc':0,
                              'tx_uc':0,
                              'rx_idle_and_scan':rx_usec
                             }
	    /* received broadcasts */
	    for (let i in stats.stats_slots_rx_packet) {
		let bytes = +i + this.PHY_OVERHEAD_BYTES;
		rx_usec += stats.stats_slots_rx_packet[i] * this.TSCH_BYTE_USEC * bytes;
                detail['rx_bc'] += stats.stats_slots_rx_packet[i] * this.TSCH_BYTE_USEC * bytes;
	    }
	    /* received unicasts */
	    for (let i in stats.stats_slots_rx_packet_tx_ack) {
		let bytes = +i + this.PHY_OVERHEAD_BYTES;
		rx_usec += stats.stats_slots_rx_packet_tx_ack[i] * this.TSCH_BYTE_USEC * bytes + this.TSCH_SLOT_RX_WAIT_USEC / 2;
                detail['rx_uc'] += stats.stats_slots_rx_packet_tx_ack[i] * this.TSCH_BYTE_USEC * bytes + this.TSCH_SLOT_RX_WAIT_USEC / 2;
		tx_usec += stats.stats_slots_rx_packet_tx_ack[i] * this.TSCH_BYTE_USEC * this.PHY_ACK_SIZE;
                detail['tx_uc'] += stats.stats_slots_rx_packet_tx_ack[i] * this.TSCH_BYTE_USEC * this.PHY_ACK_SIZE;
	    }
	    /* transmitted broadcasts */
	    for (let i in stats.stats_slots_tx_packet) {
		let bytes = +i + this.PHY_OVERHEAD_BYTES;
		tx_usec += stats.stats_slots_tx_packet[i] * this.TSCH_BYTE_USEC * bytes;
                detail['tx_bc'] += stats.stats_slots_tx_packet[i] * this.TSCH_BYTE_USEC * bytes;
	    }
	    /* transmitted unicasts */
	    for (let i in stats.stats_slots_tx_packet_rx_ack) {
		let bytes = +i + this.PHY_OVERHEAD_BYTES;
		rx_usec += stats.stats_slots_tx_packet_rx_ack[i] * this.TSCH_BYTE_USEC * this.PHY_ACK_SIZE + this.TSCH_SLOT_ACK_WAIT_USEC / 2;
		tx_usec += stats.stats_slots_tx_packet_rx_ack[i] * this.TSCH_BYTE_USEC * bytes;
                detail['rx_uc'] += stats.stats_slots_tx_packet_rx_ack[i] * this.TSCH_BYTE_USEC * this.PHY_ACK_SIZE + this.TSCH_SLOT_ACK_WAIT_USEC / 2;
                detail['tx_uc'] += stats.stats_slots_tx_packet_rx_ack[i] * this.TSCH_BYTE_USEC * bytes;
	    }
            for(let key in detail){
                detail[key] /= total_usec;

            }
        log.log(log.INFO, null, "Main",`detail_tx ${detail['tx_uc']+detail['tx_bc']},tx=${tx_usec / total_usec},detail_rx ${detail['rx_uc']+detail['rx_bc']},rx =${rx_usec / total_usec} `);
	    return {
		scanning: scanning_usec / total_usec,
		tx: tx_usec / total_usec,
		rx: rx_usec / total_usec,
		total: (tx_usec + rx_usec) / total_usec,
                details: detail
	    };
	}

    initialize(){
        return new Energy_model();
    }

}

export let energy_model = new Energy_model();
