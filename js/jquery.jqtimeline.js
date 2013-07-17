/*!
 * jqtimeline Plugin
 * http://goto.io/jqtimeline
 *
 * Copyright 2013 goto.io
 * Released under the MIT license
 *
 */
;
(function($) {
	var pluginName = 'jqTimeline',
		defaults = {
			showToolTip : true,
			groupEventWithinPx : 6, // Will show common tooltip for events within this range of px
			events : [],
			click : null //Handler for click event for event
		};

	function jqTimeLine(element, options) {
		this.options = $.extend({}, defaults, options);
		this.$el = $(element);
		this._defaults = defaults;
		this.start = new Date();
		this.end = new Date();
		this._name = pluginName;
		this._offset_x = 14; // Starting position of the line
		this._totalWidth = this.$el.width();
		this._eDotWidth = 16; // Width of the event dot shown in the ui
		this._$toolTip = null; // use to have reference of the tooltip
		this._a$Events = []; // will store all jquery elements of events, marked on the timeline
		this._aEvents = []; //array of events obj {id,name,on}
		this._counter = 0 ; // Use to generate id for events without ids
		this.$mainContainer;
		this.init();
	}

	jqTimeLine.prototype.init = function() {
		_this = this;
		this._calculateStartEnd();
		this._generateMarkup();
		//Attach a event handler to global container
		if(_this.options.click){
			_this.$mainContainer.on('click',function(e){
				var $t = $(e.target);
				if($t.hasClass('event') || $t.hasClass('msg')){
					//In both the cases eventId is stored in the format msg_eventid or event_eventid
					var eventId = $t.attr('id').split("_")[1];
					_this.options.click(e,_this._aEvents[eventId]);
				}
				if($t.hasClass('closeTooltip')){
					//we may need to close the tooltip
					var eventId = $t.attr('id').split("_")[1];
					var $tgt = $('#'+eventId);
					_this._addEventListner($tgt,'mouseleave');
					var $tooltipEl = $('#tooltip_' + eventId);
					$tooltipEl.remove();
				}
			});
		}
	};

	jqTimeLine.prototype._calculateStartEnd = function() {
		var _this = this;
		var start = null;
		var end = null;
		if(_this.options.events.length < 1){
			return;
		}else{
			start = this.options.events[0].on;
			end = this.options.events[0].on;
		}
		for(var k=0;k<_this.options.events.length;k++){
			var e = _this.options.events[k];
			var d = e.on;
			if(d < start){
				start = d;
			}
			if(d > end){
				end = d;
			}
		}
		_this.start = start;
		console.log("start: " + start);
		_this.end = end;
		console.log("end: " + end);
	};

	jqTimeLine.prototype._generateMarkup = function() {
		var _this = this;
		var i = 0,j=0;
		var totalWidth = _this._totalWidth;
		var containerWidth = totalWidth - 30;
		var $mainContainer = this.$mainContainer = $(
			'<div class="gt-timeline" style="width:'+totalWidth+'px">' + 
				'<div class="main_line" style="width:'+containerWidth+'px"></div>' + 
			'</div>'
		);

		//Start adding events
		for(var k=0;k<_this.options.events.length;k++){
			var e = _this.options.events[k];
			var d = e.on;
			if(d >= _this.start && d <= _this.end){
				$mainContainer.append(_this._getEventMarkup(e));
			}
		}
		_this.$el.append($mainContainer);
	};

	jqTimeLine.prototype._getGenId = function(){
		var _this = this;
		while(_this._counter in this._aEvents){
			_this._counter ++;
		}
		return _this._counter;
	}

	jqTimeLine.prototype._showToolTip=function(nLeft,strToolTip,eventId,closable){
		var _this = this;
		_this._$toolTip  = $(
								'<div class="e-message" id="tooltip_'+eventId+'" style="left:'+ nLeft +'px">' +
									'<div class="message-pointer"></div>' +
									strToolTip + 
								'</div>'
							);
		_this.$mainContainer.append(_this._$toolTip);
	}

	jqTimeLine.prototype._getAllNeighborEvents = function(nLeft){
		var _this = this;
		//Get all event within 10 px range. Group all event within 
		var neighborEvents = $('.event',_this.$mainContainer).filter(function(){
			var nCurrentElLeftVal = parseInt($(this).css('left'));
			return (nCurrentElLeftVal <= nLeft +  _this.options.groupEventWithinPx) && (nCurrentElLeftVal >= nLeft -  _this.options.groupEventWithinPx);
		});
		return neighborEvents;
	}



	jqTimeLine.prototype._getEventMarkup = function(e){
		var _this = this;
		//Attach id if not there
		if(typeof e.id === 'undefined') e.id = _this._getGenId();
		_this._aEvents[e.id] = e; //Add event to event array
		var eName = e.name;
		var leftPecentage = (e.on - _this.start) / (_this.end - _this.start);
		var containerWidth = _this._totalWidth - 30;
		var leftVal = Math.ceil(_this._offset_x + containerWidth * leftPecentage - _this._eDotWidth/2);
		var $retHtml = $('<div class="event" id="event_'+e.id+'" style="left:'+leftVal+'px">&nbsp;</div>').data('event',e);
		$retHtml.data('eventInfo',_this._aEvents[e.id]);
		if(_this.options.click){
			_this._addEventListner($retHtml,'click');
		}
		if(_this.options.showToolTip){
			_this._addEventListner($retHtml,'mouseover');
			_this._addEventListner($retHtml,'mouseleave');
		}
		_this._a$Events[e.id] = $retHtml;
		return $retHtml;
	}

	jqTimeLine.prototype._addEventListner = function($retHtml,sEvent){
		var _this = this;
		if(sEvent == 'mouseover'){
			$retHtml.mouseover( 
				function(e){
					var $t = $(e.target);
					var nLeft = parseInt($t.css('left'));
					var eObj = $t.data('event');
					if(_this._$toolTip){
						if(_this._$toolTip.data('state') && _this._$toolTip.data('state') === 'static'){
							var eventId = _this._$toolTip.data('eventId');
							var $tgt = $('#'+eventId);
							// _this._addEventListner($tgt,'mouseover');
							_this._addEventListner($tgt,'mouseleave');
							_this._$toolTip.data('state','dynamic');
						}
						_this._$toolTip.remove();
					} 

					var neighborEvents = _this._getAllNeighborEvents(nLeft);
					var strToolTip = "" ;
					for (var i = 0; i < neighborEvents.length; i++) {
						var $temp = $(neighborEvents[i]);
						var oData = $temp.data('event');
						strToolTip = strToolTip + '<div class="msg" id="msg_'+oData.id+'">'+oData.on.toISOString()+' : '+ oData.name +'</div>';
					};
					_this._showToolTip(nLeft,strToolTip,eObj.id,false);
				}
			);
		}
		if(sEvent == 'mouseleave'){
			$retHtml.mouseleave(function(e){
				var $targetObj = $(this);
				var eventId = $targetObj.data('event').id;
				var $tooltipEl = $('#tooltip_' + eventId);
				e.stopImmediatePropagation();
				var fixed = setTimeout(function(){
					$tooltipEl.remove();
				}, 500);
				$tooltipEl.hover(
					function(){clearTimeout (fixed);},
				    function(){$tooltipEl.remove();}
				);
			});
		}
		if(sEvent == 'click'){
		// Attach a click event handler to event objects
			$retHtml.click(function(e){
				var $targetObj = $(this);
				var eventId = $targetObj.data('event').id;
				var $tooltipEl = $('#tooltip_' + eventId);
				var $msgs = $('.msg',$tooltipEl);
				if($msgs.length == 1){
					// Do not stop the propogation .. let the parent handles the click event
					//_this.options.click();
				}else if($msgs.length > 1){
					// If the tooltip has more than one message make it non-dynamic
					e.stopPropagation(); // Stop the propogation so that the parent wont get notified
					var markup =	$('<div class="info">' + 
										'<div>Select one even from below : </div>' + 
										'<div class="icon-close closeTooltip" id="eCloseButton_'+eventId+'"></div>' + 
									'</div>');
					$tooltipEl.prepend(markup);
					// $retHtml.off('mouseover');
					$retHtml.off('mouseleave');
					$tooltipEl.data('state','static');
					$tooltipEl.data('eventId',eventId);
				}
			});
		}	
	}


	var isArray = function(a){
		return Object.prototype.toString.apply(a) === '[object Array]';
	}

	// public methods start from here 
	jqTimeLine.prototype.addEvent = function(e){
		var arr = [],i=0;
		arr = $.isArray(e) ? e : [e];
		for(i=0;i<arr.length;i++){
			var markup = this._getEventMarkup(arr[i]);
			this.$mainContainer.append(markup);
		}
	}

	jqTimeLine.prototype.deleteEvent = function(eIds){
		var _this = this;
		if(typeof eIds === 'undefined') return;
		var arr = [],i;
		if(typeof eIds === "number" || typeof eIds === "string"){
			arr = [eIds]; // ids can be string too
		}else if (isArray(eIds)){
			arr = eIds; // This can be array of objects 
		}else{
			arr = [eIds];// This can be object itself
		}
		for(i=0; i < arr.length;i++){
			var key = arr[i]; // This can be a event object itself
			if(typeof key === 'object'){
				if(typeof key.id === 'undefined') continue;
				else key = key.id;
			}
			var $obj = _this._a$Events[key];
			if(typeof $obj === 'undefined') continue;
			$obj.remove();
			delete _this._a$Events[key];
			delete _this._aEvents[key]; 
		}
	}

	jqTimeLine.prototype.getAllEvents = function(){
		var _this = this;
		var retArr = [];
		for(key in _this._aEvents){
			retArr.push(_this._aEvents[key])
		}
		return retArr;
	}

	jqTimeLine.prototype.getAllEventsElements = function(){
		var _this = this;
		var retArr = [];
		for(key in _this._a$Events){
			retArr.push(_this._a$Events[key])
		}
		return this._a$Events;
	}

	$.fn.jqtimeline = function(options) {
		return this.each(function() {
			var element = $(this);
			if(element.data('timeline')) return;
			var timeline = new jqTimeLine(this, options);
			element.data('jqtimeline', timeline);
		});
	};

}(jQuery, window));
