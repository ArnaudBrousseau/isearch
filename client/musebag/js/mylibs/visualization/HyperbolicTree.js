define("mylibs/visualization/HyperbolicTree", 
	[	
		"order!js/mylibs/visualization/Complex.js",
		"order!js/mylibs/visualization/HPoint.js",	
		"order!js/mylibs/visualization/HyperGraph.js",
		"order!js/mylibs/visualization/gmap.js",	
		"order!js/mylibs/visualization/layout/Extent.js",
		"order!js/mylibs/visualization/layout/Candidate.js",
		"order!js/mylibs/visualization/layout/Feature.js",
		"order!js/mylibs/visualization/layout/CandidateIndex.js",
		"order!js/mylibs/visualization/layout/LabelManager.js",
		"order!js/mylibs/visualization/UI.js",
		"order!js/mylibs/visualization/Thumbnail.js",
		"order!js/mylibs/visualization/audio/dsp.js",
		"order!js/mylibs/visualization/audio/audio.js",
		"order!js/mylibs/visualization/audio/audioRenderer.js",
		"order!js/mylibs/visualization/ThumbContainer.js",
		"order!js/mylibs/visualization/Tween.js"
	],	function() {
  
	Point = function(x, y) {
		this.x = x ;
		this.y = y ;
	};	 


	HyperbolicTree = function(searchResults, container, options) {
		this.container = container ;
		this.searchResults = searchResults ;

		this.thumbOptions = {  } ;

		if ( options.thumbSize )
			this.thumbOptions.thumbSize = options.thumbSize ;

		if ( options.onItemClick )
			this.thumbOptions.onClick = options.onItemClick ;
			
		if ( options.iconArrange )
			this.thumbOptions.iconArrange = options.iconArrange ;
		
		if ( options.thumbRenderer )
			this.thumbOptions.thumbRenderer = options.thumbRenderer ;

		this.graph = new HyperGraph(searchResults) ;

		this.createCanvas() ;

		this.translateTo(new HPoint(0, 0)) ;
		this.graph.saveState() ;

		this.draw(0) ;
	};

	var p = HyperbolicTree.prototype;

	p.container = null ;
	p.searchResults = null ;
	p.graph = null ;
	p.canvas = null ;
	p.ctx = null ;
	p.thumbOptions = null ;

	HyperbolicTree.iconSize = 64 ;

	p.setOptions = function(options) {
		if ( options.thumbSize ) 
			this.thumbOptions.thumbSize = options.thumbSize ;
		if ( options.iconArrange ) 
			this.thumbOptions.iconArrange = options.iconArrange ;
		if ( options.thumbRenderer )
			this.thumbOptions.thumbRenderer = options.thumbRenderer ;
			
		var pageBox = $('.page-container', this.container) ;
		
		if ( pageBox.length > 0 )
			this.redrawThumbView($(".page-content", pageBox), this.currentIdx) ;
		
	};

	p.createCanvas = function()	{
		var obj = this ;

		$(this.container).empty() ;

		var cw = $(this.container).width()  ;
		var ch = $(this.container).height() ;

		this.canvas = $("<canvas/>").appendTo(this.container).get(0) ;

		this.canvas.width = cw ;
		this.canvas.height = ch ;

		this.ctx = this.canvas.getContext("2d");

		if ( cw > ch ) 
		{
			this.ctx.translate((cw - ch)/2 + ch/2, ch/2) ;
			this.ctx.scale(ch/2, ch/2) ;

		}
		else 
		{
			this.ctx.translate(cw/2, (ch - cw)/2 + cw/2) ;
			this.ctx.scale(cw/2, cw/2) ;
		}

		this.clicks = 0 ;
		var self = this ;
		
		$(this.canvas).click(function(e) {
			self.clicks++ ;
			if (self.clicks == 1) 
			{
				setTimeout(function()	{
					if ( self.clicks == 1) {
						self.handleMouseClick(e) ;
					} else {
						self.handleMouseDoubleClick(e) ;
					}
					self.clicks = 0;
				}, 300);
			}
		});
  

		// this.canvas.addEventListener("click", function(e) { obj.handleMouseClick(e) ; }, false);
	  //	this.canvas.addEventListener("dblclick", function(e) { obj.handleMouseDoubleClick(e) ; }, false);
	};

	p.getPosition = function(event)	{
		var x = new Number();
		var y = new Number();
		var canvas = this.canvas ;

		if (event.x != undefined && event.y != undefined)
		{
			x = event.x;
			y = event.y;
		}
		else // Firefox method to get the position
		{
			x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		x -= $(canvas).offset().left;
		y -= $(canvas).offset().top;

		return {"x": x, "y": y} ;
	};

	p.globalToLocal = function(pt)	{
		var cw = this.canvas.width  ;
		var ch = this.canvas.height ;
		var x, y ;

		if ( cw > ch ) 
		{
			var scale = ch/2 ;
			var offx = (cw - ch)/2 + ch/2 ;
			var offy = ch/2 ;

			x = (pt.x - offx)/scale ;
			y = (pt.y - offy)/scale ;
		}
		else 
		{
			var scale = cw/2 ;
			var offx = cw/2 ;
			var offy = (ch - cw)/2 + cw/2 ;
			x = (pt.x - offx)/scale ;
			y = (pt.y - offy)/scale ;
		}

		return new Point(x, y) ;
	};

	p.handleMouseClick = function(e) {
		var pt = this.getPosition(e) ;

		var lp = this.globalToLocal(pt) ;
			
		this.translateTo(new HPoint(lp.x, -lp.y)) ;

		var tween = new Tween(this, 0, 1, 500, Tween.linear) ;

	};
	
	p.handleMouseDoubleClick = function(e) {
		var pt = this.getPosition(e) ;

		var lp = this.globalToLocal(pt) ;

		for(var i =0 ; i<this.graph.nodes.length  ; i++ )
		{
			var node = this.graph.nodes[i] ;

			if ( lp.x >= node.px - node.thumbSize/2 && lp.x <= node.px + node.thumbSize/2 &&
				lp.y >= node.py - node.thumbSize/2 && lp.y <= node.py + node.thumbSize/2 )
			{
				this.onImageClicked(i) ;
				return ;
			}
		}
	}
	
	p.redrawThumbView = function(ele, idx)
	{
		this.icons = new ThumbContainer(ele, this.graph.icons[idx], this.thumbOptions) ;
		this.icons.draw() ;
		
	};

	p.onImageClicked = function(idx) {
		var that = this ;
		UI.showPage(this.container, "Cluster View", function(ele) {
			that.currentIdx = idx ;
			that.redrawThumbView(ele, idx) ;
		}) ;
	};


	p.onTweenUpdate = function(value) {
		this.draw(value, true) ;
	};

	p.onTweenEnd = function(val) {
		this.draw(val, false) ;      
	};

	p.onResize = function(event) {
		this.createCanvas() ;
		this.draw(0) ;
	};

	p.drawNode = function(node)	{
		node.show(this.ctx, node.pos.x(), node.pos.y()) ;
	};

	p.draw = function(t, fast) 	{
		if ( fast == undefined ) fast = false ;

		var w = this.canvas.width ;
		var h = this.canvas.height ;

		var radius = 1.0 ;

		this.ctx.clearRect(-1, -1, 2, 2)  ;

		this.ctx.strokeStyle = "#474747";
		this.ctx.lineWidth = 4/(Math.min(w,h)/2) ;
		this.ctx.beginPath();
		this.ctx.arc(0, 0, 1.0, 0, Math.PI*2, false);
		this.ctx.closePath();
		this.ctx.stroke();

		this.computeNodes(t) ;

		this.drawEdges() ;
		if ( !fast ) this.drawNodes() ;
	};

	p.translateTo = function(at) {
		this.graph.saveState() ;
		var at_ = new HPoint(at.x(), -at.y());
		this.graph.transform(new HPoint(1, 0), at_) ;
	};

	p.drawArc = function(centerX, centerY, startAngle, endAngle, radius, direction)	{
		this.ctx.beginPath() ;
		this.ctx.arc(centerX, centerY, radius, startAngle, endAngle, ( direction < 0 ) ? true: false) ;
		this.ctx.stroke() ;
	};

	p.drawArcTroughTwoPoints = function(p1, p2)	{
		var cx, cy, ratio, radius, a, b ;

		var aDen = p1.x()*p2.y() - p1.y()*p2.x() ;

		if ( Math.abs(aDen) < 1.0e-5 ) 
		{
			var tp1 = new Point(p1.x(), p1.y()) ;
			var tp2 = new Point(p2.x(), p2.y()) ;

			this.ctx.beginPath() ;
			this.ctx.moveTo(tp1.x, tp1.y) ;
			this.ctx.lineTo(tp2.x, tp2.y) ;
			this.ctx.stroke() ;
		}
		else {
			a = ( p1.y() * Complex.norm(p2) - p2.y() * Complex.norm(p1) + p1.y() - p2.y()) / aDen;
			b = ( p2.x() * Complex.norm(p1) - p1.x() * Complex.norm(p2) + p2.x() - p1.x()) / aDen;

			cx = -a / 2;
			cy = -b / 2;

			ratio = Math.sqrt((a*a + b*b) / 4 - 1);

			var angleEnd = HyperbolicTree.correctAngle(new HPoint(cx, cy), p2, Math.atan( Math.abs(p2.y() - cy)/Math.abs(p2.x() - cx) ));
			var angleBegin = HyperbolicTree.correctAngle(new HPoint(cx, cy), p1, Math.atan(Math.abs(p1.y() - cy)/Math.abs(p1.x() - cx)));
			var sign = HyperbolicTree.calculateDirection(angleBegin, angleEnd);


			this.drawArc(cx, cy, angleBegin, angleEnd, ratio, -sign) ;

		}
	};

	p.drawEdges = function() {
		this.graph.clearState() ;

		for(var i =0 ; i< this.graph.nodes.length ; i++ ) 
		{
			var node = this.graph.nodes[i] ;

			node.drawn = true ;

				var pos = node.pos ;

			for(var j = 0 ; j<node.children.length ; j++ )
			{
				var nb = node.children[j] ;

				if ( ! nb.drawn )
				{
					var pos_j = nb.pos ;

					this.ctx.strokeStyle = "black" ;
					this.ctx.lineWidth = 3/(Math.min(this.canvas.width, this.canvas.height)/2);
					this.drawArcTroughTwoPoints(pos, pos_j) 
					}
				}
		}		
	};

	p.computeNodes = function(t) {
		for(var i =0 ; i<this.graph.nodes.length  ; i++ )
		{
			var node = this.graph.nodes[i] ;

			var x = node.posStart.x() * (1 - t) + node.posEnd.x() * t ;
			var y = node.posStart.y() * (1 - t) + node.posEnd.y() * t ;

			node.pos = new HPoint(x, y) ;

		}
	};

	p.drawNodes = function() {
		for(var i =0 ; i<this.graph.nodes.length  ; i++ )
		{
			var node = this.graph.nodes[i] ;

			this.drawNode(node) ;
		}
	};

	HyperbolicTree.correctAngle = function(relTo, dot, angle) {
    			if (dot.x() >= relTo.x() && dot.y() >= relTo.y()) return angle;
    			if (dot.x() <= relTo.x() && dot.y() >= relTo.y()) return (Math.PI - angle);
    			if (dot.x() <= relTo.x() && dot.y() <= relTo.y()) return (Math.PI + angle);
    			if (dot.x() >= relTo.x() && dot.y() <= relTo.y()) return (Math.PI*2 - angle);
    			return 0.0 ;
	} ;

	HyperbolicTree.calculateDirection = function(angleBegin, angleEnd) {
		if( angleBegin < angleEnd ) 
		{
			if ( angleBegin + Math.PI > angleEnd ) return -1 ;
			else return 1 ;
		}
		else 
		{
			if ( angleEnd + Math.PI > angleBegin ) return 1 ;
			else return -1 ;
		}
	};
  
	return {
		create: function(searchResults, container, options) {
			return new HyperbolicTree(searchResults, container, options);
		}
	};
});

