#!/usr/bin/env python
#
###############################################################################
# $Id: wellConstruction.py
#
# Project:  wellConstruction
# Purpose:  Script outputs well construction information from NWIS data records
#            in JSON format.
# 
# Author:   Leonard Orzol <llorzol@usgs.gov>
#
###############################################################################
# Copyright (c) Leonard Orzol <llorzol@usgs.gov>
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

import os, sys, string, re

import math, random

import json

# Set up logging
#
import logging

# -- Set logging file
#
# Create screen handler
#
screen_logger = logging.getLogger()
formatter     = logging.Formatter(fmt='%(message)s')
console       = logging.StreamHandler()
console.setFormatter(formatter)
screen_logger.addHandler(console)
screen_logger.setLevel(logging.INFO)

# Import modules for CGI handling
#
from urllib.parse import urlparse, parse_qs

# Parse the Query String
#
params = {}

HardWired = None
#HardWired = 1

if HardWired is not None:
    #os.environ['QUERY_STRING'] = 'site_no=420358121280001'
    #os.environ['QUERY_STRING'] = 'site_no=414903121234001'
    #os.environ['QUERY_STRING'] = 'site_no=430508119582001'
    #os.environ['QUERY_STRING'] = 'site_no=434124119270901'
    #os.environ['QUERY_STRING'] = 'site_no=432822119011501'
    #os.environ['QUERY_STRING'] = 'site_no=431357118582301'
    #os.environ['QUERY_STRING'] = 'site_no=452335122564301'
    #os.environ['QUERY_STRING'] = 'site_no=453705119513901'
    #os.environ['QUERY_STRING'] = 'site_no=415947121243401'
    os.environ['QUERY_STRING'] = 'site_no=422508121161501'
    
if 'QUERY_STRING' in os.environ:
    queryString = os.environ['QUERY_STRING']

    queryStringD = parse_qs(queryString, encoding='utf-8')

    myParmsL = [
       'site_no'
       ]
    
    for myParm in myParmsL:
       myItems = re.escape(queryStringD.get(myParm, [''])[0]).split(',')
       if len(myItems) > 1:
          params[myParm] = re.escape(queryStringD.get(myParm, [''])[0])
       else:
          params[myParm] = re.escape(myItems[0])

if 'site_no' in params:
    site_no = params['site_no']
else:
   message = "Requires a NWIS site number"
   print("Content-type:application/json\n\n")
   print('{ "message": "%s" }' % message)
   sys.exit()

# ------------------------------------------------------------
# -- Set
# ------------------------------------------------------------
debug           = False

program         = "USGS Well Construction Grapher Script"
version         = "2.04"
version_date    = "15May2024"

program_args    = []

# =============================================================================

def processAqfrCodes (service_rdbL):

   serviceL    = []
   message     = ''
   aqfrInfoD   = {}

   myFields    = [
                  "state_cd", 
                  "aqfr_cd", 
                  "aqfr_nm"
                 ]
   
   # Parse head lines
   #
   while len(service_rdbL) > 0:
         
      Line = service_rdbL[0].strip("\n|\r")
      del service_rdbL[0]
      #print(Line)

      # Grab column names in header
      #
      if Line[0] != '#':
         columnL = Line.split('\t')
         break

   # Format line in header section
   #
   del service_rdbL[0]

   # Parse data lines
   #
   while len(service_rdbL) > 0:

      Line = service_rdbL[0].strip("\n|\r")
      del service_rdbL[0]

      valuesL  = Line.split('\t')

      state_cd = valuesL[ columnL.index('state_cd') ]
      aqfr_cd  = valuesL[ columnL.index('aqfr_cd') ]
      aqfr_nm  = valuesL[ columnL.index('aqfr_nm') ]
      
      aqfrInfoD[aqfr_cd] = aqfr_nm
 
   return message, aqfrInfoD
     

# =============================================================================

def jsonDefinitions (service_rdbL):

   serviceL    = []
   message     = ''
   codeInfoD   = {}
   ImageInfoD  = {}

   myFields    = [
                  "table_nm", 
                  "gw_ref_cd", 
                  "gw_ref_nm", 
                  "parameter_cd", 
                  "parameter_nm", 
                  "head_1_tx", 
                  "english_unit_tx", 
                  "column_nm"
                 ]
   
   # Parse head lines
   #
   if len(service_rdbL) > 0:
         
      jsonD = json.loads("".join(service_rdbL))

      # Record
      #
      for column_nm in sorted(jsonD.keys()):
         
         parameter_cd    = jsonD[column_nm]['C Number']
         parameter_nm    = jsonD[column_nm]['parameter_nm']
         english_unit_tx = jsonD[column_nm]['english_unit_tx']
         head_1_tx       = jsonD[column_nm]['head_1_tx']

         if column_nm not in codeInfoD:
            codeInfoD[column_nm] = {}

         codeInfoD[column_nm]['C Number']        = parameter_cd
         codeInfoD[column_nm]['parameter_nm']    = parameter_nm
         codeInfoD[column_nm]['english_unit_tx'] = english_unit_tx
         codeInfoD[column_nm]['head_1_tx']       = head_1_tx

         if 'Codes' not in codeInfoD[column_nm]:
            codeInfoD[column_nm]['Codes'] = {}
         
         for code in jsonD[column_nm]['Codes']:
            
            gw_ref_cd = code
            
            if isinstance(jsonD[column_nm]['Codes'][code], list):
               gw_ref_nm = jsonD[column_nm]['Codes'][code][0]
               myImage   = jsonD[column_nm]['Codes'][code][1]
               if column_nm not in ImageInfoD:
                  ImageInfoD[column_nm] = {}

               ImageInfoD[column_nm][code] = myImage
                  
            else:
               gw_ref_nm = jsonD[column_nm]['Codes'][code]

            codeInfoD[column_nm]['Codes'][gw_ref_cd] = gw_ref_nm

   return message, codeInfoD, ImageInfoD

# =============================================================================

def processDefinitions (table_nmL, service_rdbL):

   serviceL    = []
   message     = ''
   codeInfoD   = {}

   myFields    = [
                  "table_nm", 
                  "gw_ref_cd", 
                  "gw_ref_nm", 
                  "parameter_cd", 
                  "parameter_nm", 
                  "head_1_tx", 
                  "english_unit_tx", 
                  "column_nm"
                 ]
   
   # Parse head lines
   #
   while len(service_rdbL) > 0:
         
      Line = service_rdbL[0].strip("\n|\r")
      del service_rdbL[0]
      #print(Line)

      # Grab column names in header
      #
      if Line[0] != '#':
         columnL = Line.split('\t')
         break

   # Format line in header section
   #
   del service_rdbL[0]

   #print("\n".join(columnL))

   # Parse data lines
   #
   while len(service_rdbL) > 0:

      Line = service_rdbL[0].strip("\n|\r")
      del service_rdbL[0]

      valuesL = Line.split('\t')

      # Record
      #
      table_nm        = valuesL[ columnL.index('table_nm') ]
      if len(table_nm) > 0:
         table_nm = table_nm.replace('_##', '')

      # Record
      #
      if table_nm in table_nmL:
         
         column_nm       = valuesL[ columnL.index('column_nm') ]
         parameter_cd    = valuesL[ columnL.index('parameter_cd') ]
         parameter_nm    = valuesL[ columnL.index('parameter_nm') ]
         english_unit_tx = valuesL[ columnL.index('english_unit_tx') ]
         head_1_tx       = valuesL[ columnL.index('head_1_tx') ]
         gw_ref_cd       = valuesL[ columnL.index('gw_ref_cd') ]
         gw_ref_nm       = valuesL[ columnL.index('gw_ref_nm') ]

         if column_nm not in codeInfoD:
            codeInfoD[column_nm] = {}

         codeInfoD[column_nm]['C Number']        = parameter_cd
         codeInfoD[column_nm]['parameter_nm']    = parameter_nm
         codeInfoD[column_nm]['english_unit_tx'] = english_unit_tx
         codeInfoD[column_nm]['head_1_tx']       = head_1_tx

         if 'Codes' not in codeInfoD[column_nm]:
            codeInfoD[column_nm]['Codes'] = {}

         codeInfoD[column_nm]['Codes'][gw_ref_cd] = gw_ref_nm

   return message, codeInfoD

# =============================================================================

def processNwisFile (keyColumn, site_no, service_rdbL):

   serviceL    = []
   recordCount = 0
   message     = ''
   siteInfoL   = []
   siteFlag    = 0
   
   # Parse head lines
   #
   while len(service_rdbL) > 0:
         
      Line = service_rdbL[0].strip("\n|\r")
      del service_rdbL[0]
      #print(Line)

      # Grab column names in header
      #
      if Line[0] != '#':
         columnL = Line.split('\t')
         break

   # Format line in header section
   #
   del service_rdbL[0]

   # Check column names
   #
   if keyColumn not in columnL:
      message = "Missing index column " + keyColumn
      return message, serviceD

   # Parse data lines
   #
   while len(service_rdbL) > 0:

      Line = service_rdbL[0].strip("\n|\r")
      del service_rdbL[0]

      valuesL = Line.split('\t')

      indexSite = str(valuesL[ columnL.index(keyColumn) ])

      # Check site
      #
      if indexSite == site_no:

         recordD  = {}
         siteFlag = 1
      
         for column in columnL:
   
            try:
               indexValue      = valuesL[ columnL.index(column) ]
               recordD[column] = indexValue
            except ValueError:
               message  = "Parsing issue for column %s " % column
               message += "Unable to parse %s" % Line
               return message, siteInfoD

         # Check for sites with no valid location
         #
         if indexSite not in siteInfoD:
            siteInfoD[indexSite] = []
                  
         siteInfoL.append(recordD)
         
      else:
         if siteFlag > 0:
            break

   return message, siteInfoL

# =============================================================================
def get_max_min(min_value, max_value):
 
    factor         = 0.01 
    interval_shift = 0.67;
    delta          = max_value - min_value
 
    interval       = factor; 
    delta          = delta / 5.0; 
     
    # Determine interval 
    # 
    while delta > factor:
        if delta <= (factor * 1):
            interval = factor * 1
        elif (delta <= (factor * 2)):
            interval = factor * 2
        elif (delta <= (factor * 2.5)):
            if (factor < 10.0):
                interval = factor * 2
            else :
                interval = factor * 2.5
        elif (delta <= (factor * 5)):
            interval = factor * 5
        else:
            interval = factor * 10 
        factor = factor * 10 
     
    # Maximum 
    # 
    factor = int(max_value / interval)
    value  = factor * interval
    if(max_value > value ):
        value = (factor + 1) * interval; 
 
    if(abs(max_value - value) <= interval_shift * interval):
       max_value = value + interval
    else:
	    max_value = value
     
    # Minimum 
    # 
    factor = int(min_value / interval)
    value  = int(factor * interval)
    #print("Min",min_value,"Value",value,"Factor",factor)
    if(min_value < value ):
        value = (factor - 1) * interval; 
    #print("Min",min_value,"Value",value,"Factor",factor,"shift",interval_shift * interval)
 
    if(abs(min_value - value) <= interval_shift * interval):
	    min_value = value - interval
    else:
	    min_value = value
     
    return min_value,max_value,interval

# =============================================================================

# ----------------------------------------------------------------------
# -- Main program
# ----------------------------------------------------------------------
well_lookup_file = "data/well_construction_lookup.json"
aqfr_lookup_file = "data/aqfr_cd_query.txt"
gw_gwdd_file     = "data/gw_gwdd.txt"
sitefile_file    = "data/sitefile_01.txt"
siteInfoD        = {}
message          = ''
table_nmL        =  ['sitefile', 'gw_cons', 'gw_hole', 'gw_csng', 'gw_open', 'gw_geoh', 'gw_repr']
# https://staging-or.water.usgs.gov/cgi-bin/harney/requestGwChange.py?seasonOne=2001-01-01,20011-03-31,Min&seasonTwo=2020-01-01,20201-03-31,Min

# Read
#
if os.path.exists(well_lookup_file):

   # Open file
   #
   fh = open(well_lookup_file, 'r')
   if fh is None:
      message = "Can not open file %s" % well_lookup_file
      print("Content-type:application/json\n\n")
      print('{ "message": "%s" }' % message)
      sys.exit()

   contentL = fh.readlines()

   fh.close()

   if len(contentL) > 0:
      message, DefinitionsD, ImageInfoD = jsonDefinitions(contentL)

      if len(message) > 0:
         print("Content-type:application/json\n\n")
         print('{ "message": "%s" }' % message)
         sys.exit()

      if len(DefinitionsD) < 1:
         message = 'No definitions found in file ' + well_lookup_file
         print("Content-type:application/json\n\n")
         print('{ "message": "%s" }' % message)
         sys.exit()

      #print(DefinitionsD)
      #message = json.dumps(DefinitionsD,indent=2)
      #print("Content-type:application/json\n\n")
      #print('{ "message": "%s" }' % message)
      #sys.exit()
   
   else:
      print("Content-type:application/json\n\n")
      print('{ "message": "%s" }' % message)
      sys.exit()
   
else:
   message = "Can not open file %s" % well_lookup_file
   print("Content-type:application/json\n\n")
   print('{ "message": "%s" }' % message)
   sys.exit()

# Read
#
if os.path.exists(aqfr_lookup_file):

   # Open file
   #
   fh = open(aqfr_lookup_file, 'r')
   if fh is None:
      message = "Can not open file %s" % aqfr_lookup_file
      print("Content-type:application/json\n\n")
      print('{ "message": "%s" }' % message)
      sys.exit()

   contentL = fh.readlines()

   fh.close()

   if len(contentL) > 0:
      message, aqfrInfoD = processAqfrCodes(contentL)

      if len(message) > 0:
         print("Content-type:application/json\n\n")
         print('{ "message": "%s" }' % message)
         sys.exit()

      if len(aqfrInfoD) < 1:
         message = 'No definitions found in file ' + aqfr_lookup_file
         print("Content-type:application/json\n\n")
         print('{ "message": "%s" }' % message)
         sys.exit()

      #print(DefinitionsD)
      #message = json.dumps(DefinitionsD,indent=2)
      #print("Content-type:application/json\n\n")
      #print('{ "message": "%s" }' % message)
      #sys.exit()
   
   else:
      print("Content-type:application/json\n\n")
      print('{ "message": "%s" }' % message)
      sys.exit()
   
else:
   message = "Can not open file %s" % aqfr_lookup_file
   print("Content-type:application/json\n\n")
   print('{ "message": "%s" }' % message)
   sys.exit()

# Read
#
for file in table_nmL:
   
   nwis_file = os.path.join("data", "".join([file, "_01.txt"]))
   if os.path.exists(nwis_file):
   
      # Open file
      #
      fh = open(nwis_file, 'r')
      if fh is None:
         message = "Can not open sitefile file %s" % nwis_file
         print("Content-type:application/json\n\n")
         print('{ "message": "%s" }' % message)
         sys.exit()

      contentL = fh.readlines()
   
      fh.close()
   
      if len(contentL) > 0:
         message, nwisInfoD = processNwisFile("site_no", site_no, contentL)
   
         if len(message) > 0:
            print("Content-type:application/json\n\n")
            print('{ "message": "%s" }' % message)
            sys.exit()
   
         if len(nwisInfoD) > 0:
            siteInfoD[file] = nwisInfoD
         elif len(nwisInfoD) < 1 and file == "sitefile":
            print("Content-type:application/json\n\n")
            print('{ "message": "%s" }' % ("Site %s missing information in %s file" % (site_no, nwis_file)))
            sys.exit()
         elif len(nwisInfoD) < 1 and file == "gw_cons":
            print("Content-type:application/json\n\n")
            print('{ "message": "%s" }' % ("Site %s missing well construction information" % site_no))
            sys.exit()
      
      else:
         print("Content-type:application/json\n\n")
         print('{ "message": "%s" }' % message)
         sys.exit()
   
   else:
      message = "Can not open file %s" % nwis_file
      print("Content-type:application/json\n\n")
      print('{ "message": "%s" }' % message)
      sys.exit()

#print(json.dumps(siteInfoD['sitefile'],indent=2))

# Prepare output
# -------------------------------------------------
#
y_max         = -999999999999999.99
y_min         =  999999999999999.99

elevation_max = None
elevation_min = None

depth_max     = None
depth_min     =  0.0

land_surface  = 0.0

dia_max       = None
dia_min       =  0.0

# Process sitefile records
#
siteD = {}
alt_datum_cd = ""

if 'sitefile' in siteInfoD:
   recordD = {}
   for record in siteInfoD['sitefile']:
      alt_va = record['alt_va']
      try:
         land_surface  = float(alt_va)
         elevation_max = land_surface
      except:
         land_surface  = 0.0
         elevation_max = land_surface
   
      alt_datum_cd = record['alt_datum_cd']
   
      well_depth   = record['well_depth_va']
      try:
         depth_max  = float(well_depth)
      except:
         nothing       = 'nothing'
   
      hole_depth    = record['hole_depth_va']
      try:
         holeDepth  = float(hole_depth)
         if depth_max is None:
            depth_max  = holeDepth
         else:
            if holeDepth > depth_max:
               depth_max  = holeDepth
      except:
         nothing       = 'nothing'

   siteD = record
         
else:
   message = "Site %s not found in NWIS" % site_no
   print(message)
   sys.exit()   

# Process seal records
#
geohD = {}
if 'gw_geoh' in siteInfoD:

   for record in siteInfoD['gw_geoh']:
      geoh             = True
      geoh_seq_nu      = int(record['geoh_seq_nu'])
      lith_cd          = record['lith_cd']
      lith_top_va      = record['lith_top_va']
      lith_bottom_va   = record['lith_bottom_va']
      lith_unit_cd     = record['lith_unit_cd']
      
      try:
         lith_top_va   = float(record['lith_top_va'])
         if lith_top_va > depth_max:
            depth_max = lith_top_va
      except:
         lith_top_va   = None          
      
      try:
         lith_bottom_va   = float(record['lith_bottom_va'])
         if lith_bottom_va > depth_max:
            depth_max = lith_bottom_va
      except:
         lith_bottom_va   = None

      # Valid record
      #
      if geoh_seq_nu not in recordD:
         geohD[geoh_seq_nu] = {}
   
      geohD[geoh_seq_nu]['lith_cd']        = lith_cd
      geohD[geoh_seq_nu]['lith_top_va']    = lith_top_va
      geohD[geoh_seq_nu]['lith_bottom_va'] = lith_bottom_va
      geohD[geoh_seq_nu]['lith_unit_cd']   = lith_unit_cd
      geohD[geoh_seq_nu]['lith_ds']        = ''
      geohD[geoh_seq_nu]['image']          = ''
      geohD[geoh_seq_nu]['lith_unit_ds']   = ''
      if len(lith_cd) > 0:
         geohD[geoh_seq_nu]['lith_ds'] = DefinitionsD['lith_cd']['Codes'][lith_cd]
         if 'lith_cd' in ImageInfoD:
            geohD[geoh_seq_nu]['image'] = ImageInfoD['lith_cd'][lith_cd]
      if len(lith_unit_cd) > 0:
         geohD[geoh_seq_nu]['lith_unit_ds'] = aqfrInfoD[lith_unit_cd]
         if len(geohD[geoh_seq_nu]['image']) < 1:
            geohD[geoh_seq_nu]['image'] = '000.svg'

# Process seal records
#
wellD = {}
if 'gw_cons' in siteInfoD:

   myColumns = ['cons_src_cd', 'seal_cd', 'seal_ds', 'seal_depth_va', 'finish_cd', 'finish_ds']
   
   for record in siteInfoD['gw_cons']:

      cons_seq_nu      = int(record['cons_seq_nu'])
      cons_src_cd      = record['cons_src_cd']
      seal_cd          = record['seal_cd']
      finish_cd        = record['finish_cd']
      
      try:
         seal_depth_va = float(record['seal_depth_va'])
         if seal_depth_va > depth_max:
            depth_max = seal_depth_va
      except:
         seal_depth_va = record['seal_depth_va']

      # Valid record
      #
      recordD                  = {}
      recordD['cons_seq_nu']   = cons_seq_nu
      recordD['seal_depth_va'] = seal_depth_va
      recordD['cons_src_cd']   = cons_src_cd
      recordD['finish_cd']     = finish_cd
      recordD['finish_ds']     = ''
      if len(finish_cd) > 0:
         recordD['finish_ds'] = DefinitionsD['finish_cd']['Codes'][finish_cd]
      recordD['seal_cd']       = seal_cd
      recordD['seal_ds']       = ''
      recordD['seal_cl']       = ''
      if len(seal_cd) > 0:
         recordD['seal_ds'] = DefinitionsD['seal_cd']['Codes'][seal_cd]
         if 'seal_cd' in ImageInfoD:
            recordD['seal_cl'] = ImageInfoD['seal_cd'][seal_cd]
   
      if cons_seq_nu not in wellD:
         wellD[cons_seq_nu] = {}
      if 'gw_cons' not in wellD[cons_seq_nu]:
         wellD[cons_seq_nu]['gw_cons'] = {}
      wellD[cons_seq_nu]['gw_cons'] = recordD

# Process hole records
#
myHoleFields = [
                'cons_seq_nu',
                'hole_seq_nu',
                'hole_top_va',
                'hole_bottom_va',
                'hole_dia_va'
               ]

if 'gw_hole' in siteInfoD:

   for record in siteInfoD['gw_hole']:
      hole             = True
      cons_seq_nu    = int(record['cons_seq_nu'])
      hole_seq_nu    = int(record['hole_seq_nu'])
      try:
         hole_dia_va      = float(record['hole_dia_va'])
      except:
         hole             = False          
      try:
         hole_top_va      = float(record['hole_top_va'])
      except:
         hole             = False          
      try:
         hole_bottom_va   = float(record['hole_bottom_va'])
      except:
         hole             = False          

      # Valid record
      #
      if hole:

         recordD                   = {}
         recordD['cons_seq_nu']    = cons_seq_nu
         recordD['hole_seq_nu']    = hole_seq_nu
      
         try:
            hole_top_va = float(record['hole_top_va'])
            if hole_top_va > depth_max:
               depth_max = hole_top_va
         except:
            hole_top_va = record['hole_top_va']
            
         recordD['hole_top_va']    = hole_top_va
      
         try:
            hole_bottom_va = float(record['hole_bottom_va'])
            if hole_bottom_va > depth_max:
               depth_max = hole_bottom_va
         except:
            hole_bottom_va = record['hole_bottom_va']
            
         recordD['hole_bottom_va']    = hole_bottom_va
      
         try:
            hole_dia_va = float(record['hole_dia_va'])
            if dia_max is None:
               dia_max = hole_dia_va
            if hole_dia_va > dia_max:
               dia_max = hole_dia_va
         except:
            hole_dia_va = recordD['hole_dia_va']
            
         recordD['hole_dia_va']    = hole_dia_va
   
         if cons_seq_nu not in wellD:
            wellD[cons_seq_nu] = {}
         if 'gw_hole' not in wellD[cons_seq_nu]:
            wellD[cons_seq_nu]['gw_hole'] = {}
         if hole_seq_nu not in wellD[cons_seq_nu]['gw_hole']:
            wellD[cons_seq_nu]['gw_hole'][hole_seq_nu] = {}

         wellD[cons_seq_nu]['gw_hole'][hole_seq_nu] = recordD

# Process casing records
#
myCsngFields = [
                'cons_seq_nu',
                'csng_seq_nu',
                'csng_top_va',
                'csng_bottom_va',
                'csng_material_cd',
                'csng_thick_va',
                'csng_dia_va'
               ]

if 'gw_csng' in siteInfoD:

   for record in siteInfoD['gw_csng']:
      csng             = True
      cons_seq_nu      = int(record['cons_seq_nu'])
      csng_seq_nu      = int(record['csng_seq_nu'])
      csng_material_cd = record['csng_material_cd']
      
      try:
         csng_dia_va      = float(record['csng_dia_va'])
      except:
         csng             = False          
      try:
         csng_top_va      = float(record['csng_top_va'])
      except:
         csng             = False          
      try:
         csng_bottom_va   = float(record['csng_bottom_va'])
      except:
         csng             = False          

      # Valid record
      #
      if csng:
   
         recordD                     = {}
         recordD['cons_seq_nu']      = cons_seq_nu
         recordD['csng_seq_nu']      = csng_seq_nu
         recordD['csng_top_va']      = csng_top_va
         recordD['csng_bottom_va']   = csng_bottom_va
         recordD['csng_dia_va']      = csng_dia_va
         recordD['csng_material_cd'] = csng_material_cd
         recordD['csng_material_ds'] = ''
         recordD['csng_material_cl'] = ''
         if len(csng_material_cd) > 0:
            recordD['csng_material_ds']    = DefinitionsD['csng_material_cd']['Codes'][csng_material_cd]
            if 'csng_material_cd' in ImageInfoD:
               recordD['csng_material_cl'] = ImageInfoD['csng_material_cd'][csng_material_cd]
   
         if cons_seq_nu not in wellD:
            wellD[cons_seq_nu] = {}
         if 'gw_csng' not in wellD[cons_seq_nu]:
            wellD[cons_seq_nu]['gw_csng'] = {}
         if csng_seq_nu not in wellD[cons_seq_nu]['gw_csng']:
            wellD[cons_seq_nu]['gw_csng'][csng_seq_nu] = {}

         wellD[cons_seq_nu]['gw_csng'][csng_seq_nu] = recordD

         if csng_bottom_va > depth_max:
            depth_max = open_bottom_va
   
         try:
            dia = float(csng_dia_va)
            if dia_max is None:
               dia_max = dia
            if dia > dia_max:
               dia_max = dia
         except:
            nothing = "nothing"
    
# Process open interval records
#
myOpenFields = [
                'cons_seq_nu',
                'open_seq_nu',
                'open_top_va',
                'open_bottom_va',
                'open_material_cd',
                'open_cd',
                'open_dia_va'
               ]

if 'gw_open' in siteInfoD:

   for record in siteInfoD['gw_open']:
      opens            = True
      cons_seq_nu      = int(record['cons_seq_nu'])
      open_seq_nu      = int(record['open_seq_nu'])
      open_cd          = record['open_cd']
      open_material_cd = record['open_material_cd']
      
      try:
         open_dia_va      = float(record['open_dia_va'])
      except:
         opens            = False          
      try:
         open_top_va      = float(record['open_top_va'])
      except:
         opens            = False          
      try:
         open_bottom_va   = float(record['open_bottom_va'])
      except:
         opens            = False          
      
      # Valid record
      #
      if opens:
   
         recordD                     = {}
         recordD['cons_seq_nu']      = cons_seq_nu
         recordD['open_seq_nu']      = open_seq_nu
         recordD['open_top_va']      = open_top_va
         recordD['open_bottom_va']   = open_bottom_va
         recordD['open_dia_va']      = open_dia_va
         recordD['open_material_cd'] = open_material_cd
         recordD['open_cd']          = open_cd
         recordD['open_ds']          = ''
         recordD['image']            = ''
         if len(open_cd) > 0:
            recordD['open_ds'] = DefinitionsD['open_cd']['Codes'][open_cd]
            if 'open_cd' in ImageInfoD:
               recordD['image'] = ImageInfoD['open_cd'][open_cd]
   
         if cons_seq_nu not in wellD:
            wellD[cons_seq_nu] = {}
         if 'gw_open' not in wellD[cons_seq_nu]:
            wellD[cons_seq_nu]['gw_open'] = {}
         if open_seq_nu not in wellD[cons_seq_nu]['gw_open']:
            wellD[cons_seq_nu]['gw_open'][open_seq_nu] = {}

         wellD[cons_seq_nu]['gw_open'][open_seq_nu] = recordD

         if open_bottom_va > depth_max:
            depth_max = open_bottom_va
   
         try:
            dia = float(open_dia_va)
            if dia_max is None:
               dia_max = dia
            if dia > dia_max:
               dia_max = dia
         except:
            nothing = "nothing"

# Output json
# -------------------------------------------------
#
jsonL = []

jsonL.append("{")
jsonL.append('"sitefile":' + json.dumps(siteD) + ',')

if len(geohD) > 0:
   Geohs = []
   for geoh_seq_nu in sorted(geohD.keys()):
      Geohs.append(json.dumps(geohD[geoh_seq_nu]))
   jsonL.append('"gw_geoh":' + '[' + ",".join(Geohs) + '],')

jsonL.append('"well_construction":' + '{')

Records = []

for cons_seq_nu in sorted(wellD.keys()):

   Record = []
   
   if 'gw_cons' in wellD[cons_seq_nu]:
      Cons = json.dumps(wellD[cons_seq_nu]['gw_cons'])
      
      Record.append('"gw_cons":' + '[' + Cons + ']')
      
   if 'gw_hole' in wellD[cons_seq_nu]:
      Holes = []
      for seq_nu in wellD[cons_seq_nu]['gw_hole']:
         Hole = wellD[cons_seq_nu]['gw_hole'][seq_nu]
         Holes.append(json.dumps(Hole))

      Record.append('"gw_hole":' + '[' + ",".join(Holes) + ']')
      
   if 'gw_csng' in wellD[cons_seq_nu]:
      Cases = []
      for seq_nu in wellD[cons_seq_nu]['gw_csng']:
         Csng = wellD[cons_seq_nu]['gw_csng'][seq_nu]
         Cases.append(json.dumps(Csng))

      Record.append('"gw_csng":' + '[' + ",".join(Cases) + ']')
      
   if 'gw_open' in wellD[cons_seq_nu]:
      Opens = []
      for seq_nu in wellD[cons_seq_nu]['gw_open']:
         Open = wellD[cons_seq_nu]['gw_open'][seq_nu]
         Opens.append(json.dumps(Open))

      Record.append('"gw_open":' + '[' + ",".join(Opens) + ']')

   #Records.append(" { %s } " % ','.join(Record))
   Records.append(" %s " % ','.join(Record))

jsonL.append(','.join(Records))
jsonL.append('},')

if depth_max is None:
   jsonL.append('"%s": %s,' % ( "y_max", "null"))
else:
   jsonL.append('"%s": %f,' % ( "y_max", float(depth_max)))
if depth_min is None:
   jsonL.append('"%s": %s,' % ( "y_min", "null"))
else:
   jsonL.append('"%s": %f,' % ( "y_min", float(depth_min)))
if dia_max is None:
   jsonL.append('"%s": %s,' % ( "dia_max", "null"))
else:
   jsonL.append('"%s": %f,' % ( "dia_max", float(dia_max)))
jsonL.append('"%s": %f' % ( "land_surface", float(land_surface)))

jsonL.append('}')

# Output json
# -------------------------------------------------
#
print("Content-type:application/json\n\n")
print("".join(jsonL))

sys.exit()
