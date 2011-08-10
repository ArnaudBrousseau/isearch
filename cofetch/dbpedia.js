/**
 * Text fetch for Content Object production.
 * Facilitates dbpedia.org API in combination with Node.io 
 */
var nodeio = require('node.io'),
    xml2js = require('xml2js');

var methods = {
    input: false,
    run: function() {
      
      //Let's get the arguments passed to the script
      if (!this.options.args[0]) {
        this.exit('No arguments were given to the dbpedia job');
      }
      
      var query = this.options.args[0].replace(/\s/g,'+');
      var qclass = this.options.args[1];
      
      var maxResults = 1;
      var dbpediaURL = "http://lookup.dbpedia.org/api/search.asmx/KeywordSearch?"
          + 'QueryClass=' + qclass
          + '&QueryString=' + query
          + '&MaxHits=' + maxResults;
      
      var context = this;
      
      //Let's go and request our content
      this.get(dbpediaURL, function(error, data, headers) {
        
        //Exit if there was a problem with the request
        if (error) {
           this.exit(error); 
        }
        
        //The parser for parsing xml data of the dbpedia service
        var parser = new xml2js.Parser();
        //The function where the transformed JSON data comes in
        parser.on('end', function(res) {    	
        	
        	var result = {
        			"Type":"TextType",
        			"Name":"",
        			"FreeText":"",
        			"URL":""
        	};

        	if(res.Result) {
        		result.Name = res.Result.Label;
        		result.FreeText = res.Result.Description;
        		result.URL = 'http://en.wikipedia.org/wiki/' + result.URI.substring((result.URI.lastIndexOf('/')+1),result.URI.length);
        	}
        	
        	//Exit the Job returning the results array
        	context.emit(result);
        });
        //http://dbpedia.org/data/Atlantic_blue_marlin.json -- http://xmlns.com/foaf/0.1/page
        
        //Convert the XML data to JSON
        if(data) {
        	parser.parseString(data);
        }
        
      });
    }
};

//Creates the job
var job = new nodeio.Job({timeout:10}, methods);

//Exposes it publicly
exports.fetch = function(query, queryClass, callback) {
  nodeio.start(job, {args: [query,queryClass]}, callback, true);
};