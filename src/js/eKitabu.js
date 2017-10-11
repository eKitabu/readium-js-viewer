


console.log('Creating eSpeakNG instance...');
function PushAudioNode(context, start_callback, end_callback, buffer_size) {
    this.context = context;
    this.start_callback = start_callback;
    this.end_callback = end_callback;
    this.buffer_size = buffer_size || 4096;
    this.samples_queue = [];
    this.scriptNode = context.createScriptProcessor(this.buffer_size, 1, 1);
    this.connected = false;
    this.sinks = [];
    this.startTime = 0;
    this.closed = false;
    this.track_callbacks = new Map();
  }
  
  PushAudioNode.prototype.push = function(chunk) {
    if (this.closed) {
      throw 'Cannot push more chunks after node was closed';
    }
    this.samples_queue.push(chunk);
    if (!this.connected) {
      if (!this.sinks.length) {
        throw 'No destination set for PushAudioNode';
      }
      this._do_connect();
    }
  }
  
  PushAudioNode.prototype.close = function() {
    this.closed = true;
  }
  
  PushAudioNode.prototype.connect = function(dest) {
    this.sinks.push(dest);
    if (this.samples_queue.length) {
      this._do_connect();
    }
  }
  
  PushAudioNode.prototype._do_connect = function() {
    if (this.connected) return;
    this.connected = true;
    for (var dest of this.sinks) {
      this.scriptNode.connect(dest);
    }
    this.scriptNode.onaudioprocess = this.handleEvent.bind(this);
  }
  
  PushAudioNode.prototype.disconnect = function() {
    this.scriptNode.onaudioprocess = null;
    this.scriptNode.disconnect();
    this.connected = false;
  }
  
  PushAudioNode.prototype.addTrackCallback = function(aTimestamp, aCallback) {
    var callbacks = this.track_callbacks.get(aTimestamp) || [];
    callbacks.push(aCallback);
    this.track_callbacks.set(aTimestamp, callbacks);
  }
  
  PushAudioNode.prototype.handleEvent = function(evt) {
    if (!this.startTime) {
      this.startTime = evt.playbackTime;
      if (this.start_callback) {
        this.start_callback();
      }
    }
  
    var currentTime = evt.playbackTime - this.startTime;
    var playbackDuration = this.scriptNode.bufferSize / this.context.sampleRate;
    for (var entry of this.track_callbacks) {
      var timestamp = entry[0];
      var callbacks = entry[1];
      if (timestamp < currentTime) {
        this.track_callbacks.delete(timestamp);
      } else if (timestamp < currentTime + playbackDuration) {
        for (var cb of callbacks) {
          cb();
        }
        this.track_callbacks.delete(timestamp);
      }
    }
  
    var offset = 0;
    while (this.samples_queue.length && offset < evt.target.bufferSize) {
      var chunk = this.samples_queue[0];
      var to_copy = chunk.subarray(0, evt.target.bufferSize - offset);
      if (evt.outputBuffer.copyToChannel) {
        evt.outputBuffer.copyToChannel(to_copy, 0, offset);
      } else {
        evt.outputBuffer.getChannelData(0).set(to_copy, offset);
      }
      offset += to_copy.length;
      chunk = chunk.subarray(to_copy.length);
      if (chunk.length)
        this.samples_queue[0] = chunk;
      else
        this.samples_queue.shift();
    }
  
    if (!this.samples_queue.length && this.closed) {
      if (this.end_callback) {
        this.end_callback(evt.playbackTime - this.startTime);
      }
      this.disconnect();
    }
  }
  var ctx = new (window.AudioContext || window.webkitAudioContext)();
  var tts;
  var pusher;
  var pusher_buffer_size = 4096;
  var chunkID = 0;
  

  

    tts = new eSpeakNG( 'scripts/espeakng.worker.js',null);

    var TtsManager = new function()
    {
        this.speak = function(text) {
            console.log('Creating eSpeakNG instance... done');
            tts.set_rate(175);
            this.stop();
            console.log('  Setting rate... done');
            console.log('  Setting pitch...');
            tts.set_pitch(50);
            console.log('  Setting pitch... done');
            console.log('  Setting voice...');
            tts.set_voice("gmw/en");

        
            var now = Date.now();
            chunkID = 0;
        
            console.log('  Creating pusher...');
            pusher = new PushAudioNode(
            ctx,
            function() {
                //console.log('PushAudioNode started!', ctx.currentTime, pusher.startTime);
            },
            function() {
                //console.log('PushAudioNode ended!', ctx.currentTime - pusher.startTime);
            },
            pusher_buffer_size
            );
            pusher.connect(ctx.destination);
            console.log('  Creating pusher... done');
        
            // actual synthesis
            console.log('  Calling synthesize...');
            tts.synthesize(
            text,
            function cb(samples, events) {
                //console.log('  Inside synt cb');
                if (!samples) {
                if (pusher) {
                    pusher.close();
                }
                return;
                }
                if (pusher) {
                //console.log('  Pushing chunk ' + chunkID, Date.now());
                pusher.push(new Float32Array(samples));
                ++chunkID;
                }
                if (now) {
                //console.log('  Latency:', Date.now() - now);
                now = 0;
                }
                //console.log('  Leaving synt cb');
            } // end of function cb
            ); // end of tts.synthesize()
            console.log('  Calling synthesize... done');
        
            console.log('Leaving speak()');
        }, // end of speak()

        this.stop = function () {
            console.log('Inside stop()');
            if (pusher) {
            console.log('  Calling pusher.disconnect...');
            pusher.disconnect();
            console.log('  Calling pusher.disconnect... done');
            pusher = null;
            }
            console.log('Leaving stop()');
        } // end of stop()

    }

$("#closeSplash").on("click",function(e) { e.preventDefault(); $("#splashScreen").fadeOut(); } );