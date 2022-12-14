
const Card = require("./card");

function fisherYatesShuffle(a){
    for(var i =a.length-1 ; i>0 ;i--){
        var j = Math.floor( Math.random() * (i + 1) );
        [a[i],a[j]]=[a[j],a[i]]; // swap
    }
}


class SkillLog
{
	constructor(i,t,p,d)
	{
		this.index = i
		this.timing = t
		this.priority = p
		this.data = d
	}
}

class Player
{
	constructor(deck,hand_count,card_catalog,shuffle = true)
	{
		this.deck_list = [];

		this.hand = [];
		this.stock = [];
		this.played = [];
		this.discard = [];
		this.life = 0;

		this.next_effect = new Card.Affected()

		this.playing_hand = [];
		this.select = -1;
		this.damage = 0;
		this.draw_indexes = [];
		this.select_card = null;
		this.skill_log = []

		this.multiply_power = 1.0;
		this.multiply_hit = 1.0;
		this.multiply_block = 1.0;

		this.deck_list.length = deck.length;
		this.stock.length = deck.length;
		for (let i = 0; i < deck.length;i++)
		{
			const c =  new Card.Card(card_catalog.get_card_data(deck[i]),i);
			this.deck_list[i] = c;
			this.stock[i] = i;
			this.life += c.data.level;
		}
		if (shuffle)
			fisherYatesShuffle(this.stock)
		for (let i = 0;i < hand_count;i++)
			this.draw_card();
	}

	get_hand_card(index){return this.deck_list[this.hand[index]];}
	get_lastplayed_card(){return this.played.length == 0 ? null : this.deck_list[this.played[this.played.length-1]];}

	combat_start(index)
	{
		this.playing_hand = [...this.hand]
		this.select = index;
		this.draw_indexes.length = 0;
		this.skill_log.length = 0;
		this.deck_list.forEach((v)=>{
			v.affected.reset_update();
		});
		this.select_card = this.deck_list[this.hand.splice(index,1)[0]];
		this.life -= this.select_card.data.level;
		this.select_card.affected.add(this.next_effect.power,this.next_effect.hit,this.next_effect.block);
		this.next_effect.reset();
		this.multiply_power = 1.0;
		this.multiply_hit = 1.0;
		this.multiply_block = 1.0;
		return;
	}

	get_current_power(){return Math.floor(this.select_card.get_current_power() * this.multiply_power);}
	get_current_hit(){return Math.floor(this.select_card.get_current_hit() * this.multiply_hit);}
	get_current_block(){return Math.floor(this.select_card.get_current_block() * this.multiply_block);}

	damage_is_fatal()
	{
		const total_damage = this.damage - this.get_current_block();
		this.damage = total_damage < 0 ? 0 : total_damage;
		return this.life <= this.damage
	}

	combat_end()
	{
		this.played.push(this.select_card.id_in_deck);

		this.draw_card();
		if (this.damage > 0)
			this.draw_card();
	}
	add_damage(d) {this.damage += d;}

	recover(index)
	{
		this.playing_hand = [...this.hand]
		this.select = index;
		this.draw_indexes.length = 0;
		this.skill_log.length = 0;
		this.select_card = this.deck_list[this.hand[index]];
		const id = this.discard_card(index);
		const card = this.deck_list[id];
		if (this.damage <= card.data.level)
		{
			this.damage = 0;
			return;
		}
		this.damage -= card.data.level;
		this.draw_card();
	}

	no_recover()
	{
		this.playing_hand = [...this.hand]
		this.select = -1;
		this.draw_indexes.length = 0;
		this.skill_log.length = 0;
	}
	
	is_recovery(){return this.damage == 0;}

	change_order(new_indexies)
	{
		if (new_indexies.length != this.hand.length)
			return false;
		for (let i = 0; i < this.hand.length;i++)
		{
			if (!new_indexies.includes(this.hand[i]))
				return false
		}
		for (let i = 0; i < this.hand.length;i++)
		{
			this.hand[i] = new_indexies[i]
		}
		return true
	}

	reset_select() {this.select = -1;this.select_card = null;}

	draw_card()
	{
		if (this.stock.length == 0)
			return -1;
		const id = this.stock.pop();
		this.hand.push(id);
		this.draw_indexes.push(id);
		return id;
	}
	discard_card(i)
	{
		const id = this.hand.splice(i,1)[0];
		this.life -= this.deck_list[id].data.level;
		this.discard.push(id);
		return id;
	}

	hand_to_deck_bottom(i)
	{
		const id = this.hand.splice(i,1)[0]
		this.stock.unshift(id)
	}


	output_json_string(time)
	{
		const skill_logs = [];
		this.skill_log.forEach((l)=>{
			skill_logs.push(`{"i":${l.index},"t":${l.timing},"p":${l.priority},"d":${JSON.stringify(l.data)}}`);
		});
		return `{"h":[${this.playing_hand.join(",")}],` +
			`"i":${this.select},` +
			`"s":[${skill_logs.join(",")}],` +
			`"dc":[${this.draw_indexes.join(",")}],` +
			`"d":${this.damage},` +
			`"l":${this.life},` +
			`"t":${time}}`;
	}
}

module.exports = Player;
module.exports.SkillLog = SkillLog;
