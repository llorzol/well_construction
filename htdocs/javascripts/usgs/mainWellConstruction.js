/* Javascript plotting library for jQuery and flot.
 *
 * Main is a JavaScript library to graph NwisWeb groundwlithology information
 * for a site(s).
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

// Control for nav bar topics
//
jQuery('.noJump').click(function(e){

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

var myConstructionData;

var aboutFiles     = {
                      "welcome" :              "wellconstruction_welcome.txt",
                      "graphFeatures" :        "wellconstruction_Features.txt",
                      "contacts" :             "wellconstruction_contacts.txt"
                     };

// Prepare when the DOM is ready 
//
$(document).ready(function()
 {
   // Current url
   //-------------------------------------------------
   var url     = new URL(window.location.href);  
   console.log("Current Url " + window.location.href);
     
   // Parse
   //-------------------------------------------------
   site_no      = url.searchParams.get('site_no');
   coop_site_no = url.searchParams.get('coop_site_no');
   station_nm   = url.searchParams.get('station_nm');
   latitude     = url.searchParams.get('latitude');
   longitude    = url.searchParams.get('longitude');
   lsdelev      = url.searchParams.get('lsdelev');
   lsdaccuracy  = url.searchParams.get('lsdaccuracy');
   lsdelevdatum = url.searchParams.get('lsdelevdatum');

   if(site_no)
     {   
      // Check NWIS site number
      //
      site_no = checkSiteNo(site_no)

      // Loading message
      //
      message = "Processing well construction information for site " + site_no;
      openModal(message);
   
      // Request for site service information
      //
      var column       = "site_no";
      var request_type = "GET";
      var script_http  = "/cgi-bin/well_construction/requestWellConstruction.py";
      var data_http    = column + "=" + site_no;
         
      var dataType     = "json";
         
      // Web request
      //
      webRequest(request_type, script_http, data_http, dataType, wellConstructionService);
     }

   else
     {                   

      // Loading message
      //
      var message = "Incorrectly formatted USGS site number or OWRD well log ID or CDWR well number: ";
      message    += "You must use the USGS station numbers, which are a number ";
      message    += "from 8 to 15 digits long. ";

      openModal(message);
      fadeModal(3000);
     }
});

function checkSiteNo(site_no) {

    if(typeof site_no === "undefined")
      {
        var message = "Incorrectly formatted USGS site number: ";
        message    += "You must use the USGS station numbers, which are a number ";
        message    += "from 8 to 15 digits long. ";
        openModal(message);
        fadeModal(10000)
        return false;
      }
    //site_no  = site_no.trim();
    site_no  = site_no.replace(/^\s+|\s+$/g,'');
    var myRe = /^(\d{8,15})$/g;
    if(!myRe.test(site_no))
      {
        var message = "Incorrectly formatted USGS site number: ";
        message    += "You must use the USGS station numbers, which are a number ";
        message    += "from 8 to 15 digits long. ";
        openModal(message);
        fadeModal(10000)
        return false;
      }

    return site_no;
}

function wellConstructionService(myWellConstruction)
  {
   console.log("wellConstructionService");

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
   if(myWellConstruction.well_construction.length < 1)
     {
      closeModal();
 
      // Warning message
      //
      message = "No well construction information for site " + site_no;
      openModal(message);

      fadeModal(3000);

      return false;
     }

   // Set well construction data
   //
   myConstructionData = myWellConstruction;

   // Call plotting routine
   //
   $(document).prop('title', 'Well Construction for site ' + site_no);
   plotwellConstruction(myWellConstruction);
  }
