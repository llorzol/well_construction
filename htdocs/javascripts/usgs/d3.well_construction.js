/**
 * Namespace: D3_Construction
 *
 * D3_Construction is a JavaScript library to provide a set of functions to build
 *  well construction information in svg format.
 *
 * version 2.02
 * May 5, 2024
*/

/*
###############################################################################
# Copyright (c) Oregon Water Science Center
# 
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.
###############################################################################
*/

// Set globals
//
var svg;
var jsonData;
var constructionData;
var Legend       = [];
var LegendList   = [];
    
var y_min, y_max, y_interval, y_range;
var y_box_min   = 50;
var y_box_max   = 600;
var y_axis      = y_box_max - y_box_min;

var x_min, x_max, x_interval, x_range;
var x_box_min   = 75;
var x_box_width = 150;
var x_box_max   = x_box_min + x_box_width;
var x_axis      = x_box_max - x_box_min;

var text_size   = 9;

var loc         = window.location.pathname;
var dir         = loc.substring(0, loc.lastIndexOf('/'));
var baseUrl     = [window.location.protocol, '//', window.location.host, dir].join('');
//console.log("baseUrl " + baseUrl);

// No information
//
function noLog(svgContainer)
  { 
   console.log("noLog");

   // No log label
   //
   label_txt       = "No Well Construction Information";
   var  label      = "translate("
   label          += [( x_box_max + x_box_min ) * 0.5, + (y_box_max + y_box_min ) * 0.5].join(", ");
   label          += ") rotate(-90)";

   var myText      = svgContainer.append("text")
                                 .attr("transform", label)
                                 .attr('class', 'y_axis_label')
                                 .text(label_txt);
  }

// Plot
//
function plotwellConstruction(myWellConstruction)
  {
   console.log("plotwellConstruction");

   // Fade modal dialog
   //
   fadeModal(1000);

   // Lithology
   //
   SiteFileData               = myWellConstruction.sitefile;
   Lithology                  = myWellConstruction.gw_geoh;
   wellConstruction           = myWellConstruction.well_construction;
   console.log("Site " + SiteFileData.site_no);
   console.log("Lithology");
   console.log(Lithology);
  
   // Plot specs
   //
   dia_max                    = myWellConstruction.dia_max;
   min_value                  = myWellConstruction.y_min;
   max_value                  = myWellConstruction.y_max;
   land_surface               = SiteFileData.alt_va;
   alt_datum_cd               = SiteFileData.alt_datum_cd;
   console.log("Max " + max_value + " Min " + min_value);
   returnList                 = get_max_min( min_value, max_value);
   y_min                      = returnList[0];
   y_max                      = returnList[1];
   y_interval                 = returnList[2];
   if(y_min < 0) { y_min = 0.0; }
   y_range                    = y_max - y_min
   console.log("Max " + y_max + " Min " + y_min + " interval " + y_interval);

   returnList                 = get_max_min( 0.0, dia_max);
   x_min                      = returnList[0];
   x_max                      = returnList[1];
   x_interval                 = returnList[2];
   x_range                    = x_max - x_min
   console.log("Dia Max " + x_max + " Min " + x_min + " interval " + x_interval);
	
   // SVG canvas
   //
   var svg = d3.select("#svgCanvas");

   // Add site information
   //
   var myText      = svg.append("text")
                        .attr('x', x_box_min)
                        .attr('y', y_box_min * 0.5)
                        .attr('class', 'site_title')
                        .text("Site " + site_no);

   // Draw bore hole
   //
   axisBox(
           svg, 
           x_box_min, 
           x_box_max, 
           y_box_min, 
           y_box_max,
           "#cccccc"
          )

   // No well construction information
   //
   if(wellConstruction.length < 1)
     {
      noLog(svg);
  
      return false;
     }
	
   // Add tooltip
   //
   var tooltip = addToolTip();

   // Label axes
   //
   leftAxis(
            svg, 
            x_box_min, 
            x_box_max, 
            y_box_min, 
            y_box_max, 
            y_min, 
            y_max, 
            y_interval, 
            "Depth Below Land Surface, in feet"
           );

   var elevation_max     = land_surface;
   var elevation_string  = land_surface.toString();
   var elevation_min     = elevation_max - y_max;
   var axis_label        = "Elevation, in feet " + alt_datum_cd;
   var altitude_accuracy = 0;
   if(elevation_string.indexOf(".") > -1)
     {
      var strIndex          = elevation_string.indexOf(".") + 1;
      var altitude_accuracy = elevation_string.substr(strIndex).length;
     }
   rightElevationAxis(
                      svg, 
                      x_box_min, 
                      x_box_max, 
                      y_box_min, 
                      y_box_max, 
                      elevation_min, 
                      elevation_max, 
                      y_interval, 
                      axis_label,
                      altitude_accuracy
                     );

   if(dia_max)
     {
      labelWellboreDiameter(
                            svg, 
                            x_box_min, 
                            x_box_max, 
                            y_box_min, 
                            y_box_max, 
                            x_min, 
                            x_max, 
                            "Borehole Diameter, inches"
                           );
     }

   // Lithology
   //
   if(Lithology)
     {
      addLithology(svg, Lithology, tooltip)
     }

   // Construction
   //
   addWellConstruction(svg, wellConstruction, tooltip)

   // Legend
   //
   addLegend(svg, LegendList, Legend)
  }

function addLithology(svgContainer, lithologyData, tooltip)
  { 
   console.log("addLithology");

   // Loop through lithology
   //
   var tempData     = lithologyData.slice();

   //var lithology   = svgContainer.append("g")
   //                              .attr("class", "lithology")

   var protocol     = window.location.protocol; // Returns protocol only
   var host         = window.location.host;     // Returns host only
   var pathname     = window.location.pathname; // Returns path only
   var url          = window.location.href;     // Returns full URL
   var origin       = window.location.origin;   // Returns base URL
   var webPage      = (pathname.split('/'))[1];

   var defs         = svgContainer.append("defs")
                                  .attr('id', 'definitions')
    
   while ( tempData.length > 0 ) {

        var lithRecord   = tempData.shift();

        var lith_cd      = lithRecord.lith_cd;
        var description  = lithRecord.lith_ds;
        var lith_unit_cd = lithRecord.lith_unit_cd;
        var lith_unit_ds = lithRecord.lith_unit_ds;
        var fill_id      = lithRecord.image;
        var fill_image   = [baseUrl, 'patterns', lithRecord.image].join('/');
        var svg_file     = lithRecord.image
        var url          = 'url(#' + fill_id + ')'
       
        if(lith_unit_cd.length > 0) { description += " [" + lith_unit_ds + "]"; }

        var legendEntry  = description
       
        if(lith_cd.length < 1 && lith_unit_cd.length > 0)
          {
           lith_cd     = lith_unit_cd;
           description = lith_unit_ds;
           fill_id     = '000.svg';
           console.log("Reset " + lith_cd + " " + description);
           fill_image   = [baseUrl, 'patterns', fill_id].join('/');
           svg_file     = fill_id
           url          = 'red'
           legendEntry  = description
          }
       
        // Build legend
        //
        if(LegendList.indexOf(lith_cd) < 0)
          {
           var id          = fill_id
           var svg_file    = fill_image
           //var link_http   = [protocol + '/', host, webPage, svg_file].join("/");
           var link_http   = svg_file;
   
           var pattern     = defs.append("pattern")
                                 .attr('id', id)
                                 .attr('patternUnits', 'userSpaceOnUse')
                                 .attr('width', 100)
                                 .attr('height', 100)
   
           var myimage     = pattern.append('image')
                                 .attr('xlink:href', link_http)
                                 .attr('width', 100)
                                 .attr('height', 100)
                                 .attr('x', 0)
                                 .attr('y', 0)

           LegendList.push(lith_cd);
           Legend.push({ 
                        'id': lith_cd,
                        'description': legendEntry,
                        'image': fill_id
                       })
          }

        var lith_top_va = lithRecord.lith_top_va;
        var lith_bot_va = lithRecord.lith_bottom_va;
        if(lith_bot_va === null) { lith_bot_va = y_max; }
        if(typeof lith_bot_va === "undefined") { lith_bot_va = y_max; }
        console.log("Lith " + lith_cd + " -> " + description + " => " + svg_file);
        console.log("Lith " + lith_cd + " -> " + lith_top_va + " => " + lith_bot_va);

        var top_depth   = parseFloat(lith_top_va);
        var bot_depth   = parseFloat(lith_bot_va);

        var width       = x_box_max - x_box_min

        var y_top       = y_box_min + y_axis * (top_depth - y_min) / y_range
        var y_bot       = y_box_min + y_axis * (bot_depth - y_min) / y_range
        var thickness   = y_bot - y_top

        var toolTip     = [description, "from", top_depth, "to", bot_depth, "feet"].join(" ");
        var data        = [ {x:x_box_min, tooltip: toolTip}];

        var lithology   = svgContainer.append("g")
                                      .attr("class", "lithology")
                                      .data(data)

        // Add lith pattern
        //
        var myRect      = lithology.append("rect")
                                   .attr('id', lith_cd)
                                   .attr('x', x_box_min)
                                   .attr('y', y_top)
                                   .attr('width', width)
                                   .attr('height', thickness)
                                   .attr('fill', url)
                                   .attr('stroke', 'black')
                                   .attr('stroke-width', 1)
                                   .on("mousemove", function(event, d) {
                                         tooltip
                                           .style("left", event.pageX + "px")
                                           .style("top", event.pageY + "px")
                                           .style("display", "inline-block")
                                           .html(d.tooltip);
                                   })
                                   .on("mouseout", function(d){ tooltip.style("display", "none");});
        //myRect.append("title")
        //      .text(function(d) { return toolTip; });
   }
  }

function addWellConstruction(svgContainer, wellConstruction, tooltip)
  { 
   console.log("addWellConstruction");
   console.log(wellConstruction);

   // Loop through lithology
   //
   var tempData     = wellConstruction.slice();

   var wellBore     = svgContainer.append("g")
                                  .attr("class", "wellBore")

   var protocol     = window.location.protocol; // Returns protocol only
   var host         = window.location.host;     // Returns host only
   var pathname     = window.location.pathname; // Returns path only
   var url          = window.location.href;     // Returns full URL
   var origin       = window.location.origin;   // Returns base URL
   var webPage      = (pathname.split('/'))[1];

   var defs         = d3.select("#definitions")
   if(typeof defs[0] === "undefined")
     {
      var defs = svgContainer.append("defs")
                             .attr('id', 'definitions')
     }

   // Loop through construction
   //
   while ( tempData.length > 0 ) {

        var wellRecord  = tempData.shift();
        console.log(wellRecord);

        // Construction record
        //
        if(wellRecord.gw_cons)
          {
           for(var i = 0; i < wellRecord.gw_cons.length; i++)
             {
              var Record         = wellRecord.gw_cons[i];

              if(Record.seal_depth_va.toString().length > 0)
                {
                 var seal_code     = Record.seal_cd;
                 var seal_depth_va = Record.seal_depth_va;
                 var seal_ds       = Record.seal_ds;
                 var seal_color    = Record.seal_cl;

                 if(seal_color.length < 1) { seal_color = "#ED9EE9"; }
                 if(seal_ds.length < 1) { seal_ds = "Unknown"; }

                 var legendEntry   = ["Seal,", seal_ds].join(" ")
                 var color         = ""

                 // Build legend
                 //
                 if(LegendList.indexOf(legendEntry) < 0)
                   {
                    var id          = fill_id
                    var svg_file    = fill_image
                    var link_http   = [protocol + '/', host, webPage, svg_file].join("/");
            
                    var pattern     = defs.append("pattern")
                                          .attr('id', id)
                                          .attr('patternUnits', 'userSpaceOnUse')
                                          .attr('width', 100)
                                          .attr('height', 100)
            
                    var myimage     = pattern.append('image')
                                          .attr('xlink:href', link_http)
                                          .attr('width', 100)
                                          .attr('height', 100)
                                          .attr('x', 0)
                                          .attr('y', 0)
         
                    LegendList.push(legendEntry);
                    Legend.push({ 
                                 'id': ['seal_', seal_code].join(""),
                                 'description': legendEntry,
                                 'image': fill_id
                                })
                    }
   
                 var top_depth = 0.0;
                 var bot_depth = parseFloat(seal_depth_va);
         
                 var x_mid     = ( x_box_max + x_box_min ) * 0.5;
                 var width     = ( x_box_max - x_box_min ) * 0.9;
                 var x         = x_mid - 0.5 * width
         
                 var y_top     = y_box_min + y_axis * (top_depth - y_min) / y_range
                 var y_bot     = y_box_min + y_axis * (bot_depth - y_min) / y_range
                 var thickness = y_bot - y_top
         
                 var toolTip   = ["Seal,", seal_ds, "from", top_depth, "to", bot_depth, "feet"].join(" ");
                 var data      = [ {x:x_box_min, tooltip: toolTip}];
                 var Seal      = wellBore.append("g")
                                         .data(data);
                 var myRect    = Seal.append("rect")
                                     .attr('id', ['seal_', seal_code].join(""))
                                     .attr('class', 'seal')
                                     .attr('x', x)
                                     .attr('y', y_top)
                                     .attr('width', width)
                                     .attr('height', thickness)
                                     .attr('fill', seal_color)
                                     .attr('stroke', 'black')
                                     .attr('stroke-width', 1)
                                     .on("mousemove", function(event, d) {
                                           tooltip
                                             .style("left", event.pageX + "px")
                                             .style("top", event.pageY + "px")
                                             .style("display", "inline-block")
                                             .html(d.tooltip);
                                     })
                                     .on("mouseout", function(d){ tooltip.style("display", "none");});
                 //myRect.append("title")
                 //      .text(function(d) { return toolTip; });
                }
             }
          }

        // Hole record
        //
        if(wellRecord.gw_hole)
          {
           for(var i = 0; i < wellRecord.gw_hole.length; i++)
             {
              var Record         = wellRecord.gw_hole[i];

              var hole_top_va    = Record.hole_top_va;
              var hole_bottom_va = Record.hole_bottom_va;
              var hole_dia_va    = Record.hole_dia_va;

              var top_depth      = parseFloat(hole_top_va);
              var bot_depth      = parseFloat(hole_bottom_va);
              var hole_height    = parseFloat(hole_bottom_va);
      
              var x_mid          = ( x_box_max + x_box_min ) * 0.5;
              var width          = x_axis * hole_dia_va / x_range
              var x              = x_mid - 0.5 * width
      
              var y_top          = y_box_min + y_axis * (top_depth - y_min) / y_range
              var y_bot          = y_box_min + y_axis * (bot_depth - y_min) / y_range
              var thickness      = y_bot - y_top

              var toolTip        = ["Borehole diameter", hole_dia_va, "inches from", top_depth, "to", bot_depth, "feet"].join(" ");
              var data           = [ {x:x, tooltip: toolTip}];
              var Hole           = wellBore.append("g")
                                           .data(data);

              var myRect         = Hole.append("rect")
                                       .attr('class', 'hole')
                                       .attr('id', 'hole')
                                       .attr('class', 'hole')
                                       .attr('x', x)
                                       .attr('y', y_top)
                                       .attr('width', width)
                                       .attr('height', thickness)
                                       .attr('fill', 'white')
                                       .attr('stroke', 'black')
                                       .attr('stroke-width', 1)
                                       .on("mousemove", function(event, d) {
                                             tooltip
                                               .style("left", event.pageX + "px")
                                               .style("top", event.pageY + "px")
                                               .style("display", "inline-block")
                                               .html(d.tooltip);
                                       })
                                       .on("mouseout", function(d){ tooltip.style("display", "none");});
              //myRect.append("title")
              //      .text(function(d) { return toolTip; });
             }
          }

        // Casing record
        //
        if(wellRecord.gw_csng)
          {
           for(var i = 0; i < wellRecord.gw_csng.length; i++)
             {
              var Record         = wellRecord.gw_csng[i];

              var csng_top_va    = Record.csng_top_va;
              var csng_bottom_va = Record.csng_bottom_va;
              var csng_dia_va    = Record.csng_dia_va;
              var csng_code      = Record.csng_material_cd;
              var csng_material  = Record.csng_material_ds;
              var csng_color     = Record.csng_material_cl;
              if(csng_material.length < 1) { csng_material = "Not recorded"; }
              var legendEntry    = ["Casing,", csng_material].join(" ")

              // Build legend
              //
              if(LegendList.indexOf(legendEntry) < 0)
                {
                 var id          = fill_id
                 var svg_file    = fill_image
                 var link_http   = [protocol + '/', host, webPage, svg_file].join("/");
         
                 var pattern     = defs.append("pattern")
                                       .attr('id', id)
                                       .attr('patternUnits', 'userSpaceOnUse')
                                       .attr('width', 100)
                                       .attr('height', 100)
         
                 var myimage     = pattern.append('image')
                                       .attr('xlink:href', link_http)
                                       .attr('width', 100)
                                       .attr('height', 100)
                                       .attr('x', 0)
                                       .attr('y', 0)
      
                 LegendList.push(legendEntry);
                 Legend.push({ 
                              'id': ['casing_', csng_code].join(""),
                              'description': legendEntry,
                              'image': fill_id
                             })
                 }

              var top_depth      = parseFloat(csng_top_va);
              var bot_depth      = parseFloat(csng_bottom_va);
      
              var x_mid          = ( x_box_max + x_box_min ) * 0.5;
              var width          = x_axis * csng_dia_va / x_range
              var x              = x_mid - 0.5 * width
      
              var y_top          = y_box_min + y_axis * (top_depth - y_min) / y_range
              var y_bot          = y_box_min + y_axis * (bot_depth - y_min) / y_range
              var thickness      = y_bot - y_top

              var toolTip        = [csng_material, "casing diameter", csng_dia_va, "inches from", top_depth, "to", bot_depth, "feet"].join(" ");
              var data           = [ {x:x, tooltip: toolTip}];
              var Casing         = wellBore.append("g")
                                           .data(data);
      
              var myRect         = Casing.append("rect")
                                         .attr('id', ['casing_', csng_code].join(""))
                                         .attr('class', 'csng')
                                         .attr('x', x)
                                         .attr('y', y_top)
                                         .attr('width', width)
                                         .attr('height', thickness)
                                         .attr('fill', csng_color)
                                         .attr('stroke', 'black')
                                         .attr('stroke-width', 1)
                                         .on("mousemove", function(event, d) {
                                             tooltip
                                               .style("left", event.pageX + "px")
                                               .style("top", event.pageY + "px")
                                               .style("display", "inline-block")
                                               .html(d.tooltip);
                                         })
                                         .on("mouseout", function(d){ tooltip.style("display", "none");});
              //myRect.append("title")
              //      .text(function(d) { return toolTip; });
             }
          }

        // Open interval record
        //
        if(wellRecord.gw_open)
          {
           for(var i = 0; i < wellRecord.gw_open.length; i++)
             {
              var Record         = wellRecord.gw_open[i];

              var open_top_va    = Record.open_top_va;
              var open_bottom_va = Record.open_bottom_va;
              var open_dia_va    = Record.open_dia_va;
              var open_code      = Record.open_cd;
              var open_material  = Record.open_material_cd;
              var open_type      = Record.open_ds;
              var fill_id        = Record.image;
              var fill_image     = ['patterns', Record.image].join('/');
              var url            = 'url(#' + fill_id + ')'
              var legendEntry    = ["Open interval,", open_type].join(" ")

              var open_dia_va_ds = "";
              if(open_dia_va.toString().length > 0) { open_dia_va_ds = ["diameter", open_dia_va, "inches,"].join(" "); }

              // Build legend
              //
              if(LegendList.indexOf(legendEntry) < 0)
                {
                 var id          = fill_id
                 var svg_file    = fill_image
                 //var link_http   = [protocol + '/', host, webPage, svg_file].join("/");
                 var link_http   = svg_file;
         
                 var pattern     = defs.append("pattern")
                                       .attr('id', id)
                                       .attr('patternUnits', 'userSpaceOnUse')
                                       .attr('width', 100)
                                       .attr('height', 100)
         
                 var myimage     = pattern.append('image')
                                       .attr('xlink:href', link_http)
                                       .attr('width', 100)
                                       .attr('height', 100)
                                       .attr('x', 0)
                                       .attr('y', 0)
      
                 LegendList.push(legendEntry);
                 Legend.push({ 
                              'id': ['open_', open_code].join(""),
                              'description': legendEntry,
                              'image': fill_id
                             })
                 }

              var top_depth      = parseFloat(open_top_va);
              var bot_depth      = parseFloat(open_bottom_va);
      
              var x_mid          = ( x_box_max + x_box_min ) * 0.5;
              var width          = x_axis * open_dia_va / x_range
              var x              = x_mid - 0.5 * width
      
              var y_top          = y_box_min + y_axis * (top_depth - y_min) / y_range
              var y_bot          = y_box_min + y_axis * (bot_depth - y_min) / y_range
              var thickness      = y_bot - y_top
      
              var toolTip        = ["Open interval, ", open_dia_va_ds, open_type, "from", top_depth, "to", bot_depth, "feet"].join(" ");
              var data           = [ {x:x, tooltip: toolTip}];
              var Open           = wellBore.append("g")
                                           .data(data);
              var myRect         = Open.append("rect")
                                       .attr('id', ['open_', open_code].join(""))
                                       .attr('class', 'open')
                                       .attr('x', x)
                                       .attr('y', y_top)
                                       .attr('width', width)
                                       .attr('height', thickness)
                                       .attr('fill', url)
                                       .attr('stroke', 'black')
                                       .attr('stroke-width', 1)
                                       .on("mousemove", function(event, d) {
                                             tooltip
                                               .style("left", event.pageX + "px")
                                               .style("top", event.pageY + "px")
                                               .style("display", "inline-block")
                                               .html(d.tooltip);
                                       })
                                       .on("mouseout", function(d){ tooltip.style("display", "none");});
               //myRect.append("title")
               //     .text(function(d) { return toolTip; });
             }
          }
   }
  }

function addLegend(svgContainer, LegendList, Legend)
  { 
   console.log("addLegend");
  
   var x_legend     = x_box_max + 100
   var y_legend     = y_box_min
   var legend_box   = 20
   var y_top        = y_box_min

   // Loop through legend
   //
   var tempData     = Legend;
  
   var x_legend     = x_box_max + 100
   var y_legend     = y_box_min
   var legend_box   = 20
   var y_top        = y_box_min

   var descriptions = svgContainer.append("g")
                                  .attr("class", "legend_descriptions")
    
    while ( tempData.length > 0 ) {

        var Record      = tempData.shift();

        var description = Record.description
        var id          = Record.id
        var image       = Record.image
        var url         = 'url(#' + image + ')'

        var myRect      = descriptions.append("rect")
                                      //.attr('id', id)
                                      .attr('x', x_legend)
                                      .attr('y', y_top)
                                      .attr('width', legend_box)
                                      .attr('height', legend_box)
                                      .attr('fill', url)
                                      .attr('stroke', 'black')
                                      .attr('stroke-width', 1)

        var myText      = descriptions.append("text")
                                      .text(description)
                                      .attr('class', id)
                                      .attr('x', x_legend + legend_box * 1.25)
                                      .attr('y', y_top + legend_box * 0.5)
                                      .on('mouseover', function(d, i) {
                                         var id = d3.select(this).attr('class');
                                         d3.selectAll("#" + id)
                                           .transition()
                                           .duration(100)
                                           .attr('strokeWidth', 10)
                                           .attr('stroke', 'yellow')
                                      })
                                      .on('mouseout', function(d, i) {
                                         var id = d3.select(this).attr('class');
                                         d3.selectAll("#" + id)
                                           .transition()
                                           .duration(100)
                                           .attr('strokeWidth', 1)
                                           .attr('stroke', 'black')
                                      })

        y_top          += legend_box * 1.5
   }
  
   console.log("done addLegend");
  }

// Label wellbore column
//
function labelWellbore(svgContainer)
  { 
   console.log("labelWellbore");

   var tic_labels  = svgContainer.append("g")
                                 .attr("class", "tic_labels")

   y_range         = y_max - y_min;
   var max_label   = String(y_max).length;
   var tic_offset  = ( String(y_max).length + 1 ) * text_size;

   // Draw y tics and labels
   //
   var y         = 0.0
   var y_label   = land_surface
   var tics      = svgContainer.append("g")
                                 .attr("id", "tics")
                                 .attr("stroke", "black")
                                 .attr("strokeWidth", 1)
    
   while ( y <= y_max ) {
        y_tic           = y_box_min + y_axis * (y - y_min) / y_range

        // Left and right tics
        //
        var myLine      = tics.append("line")
                              //.attr('id', lith_cd)
                              .attr("x1", x_box_min)
                              .attr("y1", y_tic)
                              .attr("x2", x_box_min + 10)
                              .attr("y2", y_tic);
        var myLine      = tics.append("line")
                              //.attr('id', lith_cd)
                              .attr("x1", x_box_max)
                              .attr("y1", y_tic)
                              .attr("x2", x_box_max - 10)
                              .attr("y2", y_tic);

        // Left and right tic labels
        //
        y_label_txt      = String(y);
        label_x          = x_box_min - text_size;
        label_y          = y_tic + text_size * 0.50;

        var myText       = tic_labels.append("text")
                                     .attr('x', label_x)
                                     .attr('y', label_y)
                                     .attr('class', 'tic_labels')
                                      .text(y_label_txt);
             
             
        label_x          = x_box_max + max_label * text_size;
        var myText       = tic_labels.append("text")
                                     .attr('x', label_x)
                                     .attr('y', label_y)
                                     .attr('class', 'tic_labels')
                                     .text(y_label_txt);
     
        y               += y_interval
   }

   // Left axis label
   //
   label_txt       = "Depth Below Land Surface, in feet";
   var  label      = "translate("
   label          += [x_box_min * 0.25, + (y_box_max + y_box_min ) * 0.5].join(", ");
   label          += ") rotate(-90)";

   var myText      = tic_labels.append("text")
                               .attr("transform", label)
                               .attr('class', 'y_axis_label')
                               .text(label_txt);
  }


// Label wellbore
//
function labelWellbore2(svgContainer)
  { 
   console.log("labelWellbore");
   console.log("Max " + x_max + " Min " + x_min + " interval " + x_interval);

   // Set the ranges
   //
   var yAxis = d3.scaleLinear()
                 .domain([0, max_value])
                 .range([0, y_axis]);
         
   // Create left-side Y axis
   //
   svgContainer.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + x_box_min + "," + y_box_min + ")")
      .call(d3.axisLeft(yAxis))
         
   // Create right-side Y axis
   //
   svgContainer.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + x_box_max + "," + y_box_min + ")")
      .call(d3.axisRight(yAxis));
 
   // Set the ranges
   //
   //var xAxis = d3.scaleLinear()
   //              .domain([x_min, x_max])
   //              .range([0, x_axis])
   //              .ticks(2);
         
   // Create bottom X axis
   //
   //svgContainer.append("g")
   //   .attr("class", "axis")
   //   .attr("transform", "translate(" + x_box_min + "," + y_box_max + ")")
   //   .call(d3.axisBottom(xAxis));
 }

//document.addEventListener("DOMContentLoaded", function(e)
//  {
//   // Loading message
//   //
//   message = "Processing lithology information for site " + coop_site_no;
//   //openModal(message);
//
//   // Request for site service information
//   //
//   var column       = "well_logid";
//   var coop_site_no = 'HARN  1841';
//   var request_type = "GET";
//   var script_http  = "/cgi-bin/harney/requestLithologyRecords.py?";
//   var data_http    = column + "=" + coop_site_no;
//
//   // Web request for lithology data
//   //
//   d3.json(script_http + data_http)
//       .then(function(data){
//           jsonData = data;
//
//           // Plot lithology data
//           //
//           plotLithology(jsonData)
//       });
//
//  })
