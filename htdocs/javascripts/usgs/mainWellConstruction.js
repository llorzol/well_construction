/* Javascript plotting library for D3.
 *
 * Main is a JavaScript library to graph NwisWeb well construction information
 * for a site(s).
 *
 * version 2.09
 * May 30, 2024
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

// Control for nav bar topics
//
jQuery('.noJump').click(function(e) {
  // Prevent jumping to top of page
  //
  e.preventDefault();

});

// Global
//
var agency_cd;
var site_no;
var coop_site_no;
var station_nm;
var latitude;
var longitude;
var lsdelev;
var lsdaccuracy;
var lsdelevdatum;

var myWellConstruction;
var myWellLithology;

var aboutFiles     = {
                      "welcome" :              "wellconstruction_welcome.txt",
                      "graphFeatures" :        "wellconstruction_Features.txt",
                      "contacts" :             "wellconstruction_contacts.txt"
                     };

var message = "Need a NWIS USGS site number, which is a number ";
message    += "consisting of 15 digits (example 433152121281301). ";

// Prepare when the DOM is ready 
//
$(document).ready(function()
 {
   // Current url
   //-------------------------------------------------
   var url     = new URL(window.location.href);
   //console.log("Current Url " + window.location.href);

   // Parse
   //-------------------------------------------------
   site_no      = url.searchParams.get('site_no');
   coop_site_no = url.searchParams.get('coop_site_no');

   // Check arguments
   //-------------------------------------------------
   if(site_no)
     {
       if(!checkSiteNo(site_no))
          {
            openModal(message);
            fadeModal(3000);
            return;
          }
     }

   else {

     // Loading message
     //
     openModal(message);
     fadeModal(3000);
   }

   if(coop_site_no)
     {
       if(!checkCoopSiteNo(coop_site_no))
          {
            return;
          }
     }


   // Call grapher
   //-------------------------------------------------
   if(site_no)
     {
      wellConstructionService(site_no, coop_site_no);
     }
   else
     {
       openModal(message);
       fadeModal(6000)
       return false;
     }
 });

function wellConstructionService(site_no, coop_site_no)
  {
   console.log("wellConstructionService");

   // Loading message
   //
   message  = `Processing well construction information for site ${site_no} ${coop_site_no}`;
   openModal(message);

   // Build ajax requests
   //
   var webRequests  = [];

   // Request for site information
   //
   var column       = "site_no";
   var request_type = "GET";
   var script_http  = "/cgi-bin/well_construction/requestWellConstruction.py";
   var data_http    = column + "=" + site_no;
   var dataType     = "json";

   // Web request
   //
   webRequests.push($.ajax( {
     method:   request_type,
     url:      script_http,
     data:     data_http,
     dataType: dataType,
     success: function (myData) {
         message = "Processed well construction information";
         openModal(message);
         fadeModal(2000);
         myWellConstruction = myData;
         //console.log('myWellConstruction');
         //console.log(myWellConstruction);
     },
     error: function (error) {
       message = `Failed to load well construction information ${error}`;
       openModal(message);
       fadeModal(2000);
       return false;
     }
   }));

   // Request for cooperator site information
   //
   if(coop_site_no) {

     console.log(`coop_site_no ${coop_site_no}`);

     var request_type = "GET";
     var script_http  = `https://apps.wrd.state.or.us/apps/gw/gw_data_rws/api/${coop_site_no}/gw_lithology/`
     var dataType     = "json";

     // Web request
     //
     webRequests.push($.ajax( {
       method:   request_type,
       url:      script_http,
       data:     data_http,
       dataType: dataType,
       success: function (myData) {
         message = "Processed well lithology information";
         openModal(message);
         fadeModal(2000);
         myWellLithology = myData;
         //console.log('myWellLithology');
         //console.log(myWellLithology);
       },
       error: function (error) {
         message = `Failed to load well lithology information ${error}`;
         openModal(message);
         fadeModal(2000);
         return false;
       }
     }));
   }
   //console.log('webRequests');
   //console.log(webRequests);

   // Run ajax requests
   //
   $.when.apply($, webRequests).then(function() {

     fadeModal(2000);

     processWellConstruction(myWellConstruction, myWellLithology);
   });
  }

function processWellConstruction(myWellConstruction, myWellLithology)
  {
   console.log("wellConstructionService");
   //console.log(myWellConstruction.well_construction);
   //console.log(myWellLithology);

   // Check for well construction
   //
   if(myWellConstruction.message)
     {
      closeModal();
 
      // Warning message
      //
      message = "No well construction information for site " + site_no;
      openModal(message);

      fadeModal(3000);

      return false;
     }


   // Check for well construction
   //
   if(!myWellConstruction.well_construction)
     {
      closeModal();
 
      // Warning message
      //
      message = "No well construction information for site " + site_no;
      openModal(message);

      fadeModal(3000);

      return false;
     }

    // Call plotting routine
    //
    $(document).prop('title', 'Well Construction for site ' + site_no);
    
    plotwellConstruction(myWellConstruction, myWellLithology);
  }
