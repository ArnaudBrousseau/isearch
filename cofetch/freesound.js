var nodeio = require('node.io');

var methods = {
    input: false,
    run: function() {
      
      var APIKey = "57e0e646aa4941d69cf383575afec73d";
      
      //Let's get the arguments passed to the script
      if (!this.options.args[0]) {
        this.exit('No arguments were given to the Freesound job');
      }
      var query = this.options.args[0].replace(/\s/g,'+');
      var isGeo = this.options.args[1];
      var results = new Array();
      
      var maxResults = 5;
      var freesoundURL = "http://tabasco.upf.edu/api/sounds/search/?"
          + 'q=' + query
          + '&api_key=' + APIKey;
      
      if (isGeo) {
        //If we want geotagged sounds
        freesoundURL += '&f=is_geotagged:true';
      }
      //Store the current context
      var that = this;
      
      //Let's go and request our content
      this.get(freesoundURL, function(error, data, headers) {
        
        //Exit if there was a problem with the request
        if (error) {
           that.exit(error); 
        }
        
        var result = {};
        
        if(data) {
	        var freesoundResponse = JSON.parse(data);
	        var sounds = freesoundResponse.sounds;
	                
	        var soundID;
	        var soundData;
	        var detailsURL;
	        
	        if(sounds.length < maxResults) {
	        	maxResults = sounds.length;
	        }
	        
	        //let's loop through the array of videos
	        for (var i=0;i<maxResults;i++) {
	        	
	          //We get the ID of a sound
	          soundID = sounds[i].id;
	          
	          //Building of the URL to get the details about a sound
	          detailsURL = "http://beta.freesound.org/api/sounds/"
	              + soundID
	              + '?api_key=' + APIKey;
	          
	          that.get(detailsURL, function(detailsError, soundResponse, detailsHeaders) {
	            //Exit if there was a problem with the request
	            if (detailsError) {
	               that.exit(detailsError); 
	            }
	            
	            if(soundResponse) {
		            soundData = JSON.parse(soundResponse);
		            result = {
		              "Type": "SoundType",
		              "Name": soundData['original_filename'],
		              "Tags": soundData.tags,
		              "Extension": soundData.type,
		              "Licence": "CC", 
		              "LicenceURL": soundData.license,
		              "Author": soundData.user.username,
		              "Date": soundData.created,
		              "Size": "",
		              "URL": soundData.url,
		              "Preview": soundData.waveform_m,
		              "PreviewOGG": soundData['preview-lq-ogg'],
		              "Length": soundData.duration,
		              "Emotions": [],
		              "Location": [],
		              "Weather": {}
		            };
	            }
	            results.push(result);
	            
	            if (results.length===maxResults) {
	              //Exit the job if we're done, i.e Array full
	              that.emit(results);
	            }
	          }); 
	        }
        }
      }); // end get method
    }
};

//Creates the job
var job = new nodeio.Job({timeout:20}, methods);

//Exposes it publicly
exports.fetch = function(query, isGeo, callback) {
  nodeio.start(job, {args: [query, isGeo]}, callback, true);
};
