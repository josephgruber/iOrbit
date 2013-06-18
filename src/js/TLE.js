// Copyright 2011 - 2013 Joseph Gruber. All Rights Reserved.
// Author: Joseph Gruber
// Email: joseph.gruber@gmail.com
// Version: 0.0.1
// Description: This file performs all functions related to two line elements including it's primary purpose of parsing a NORAD TLE into its various properties

/**
 * iOrbit namespace
 */
if (typeof iOrbit == "undefined") {
    var iOrbit = {};
};

/**
 * Instantiates a new Two Line Element (TLE) object
 */
iOrbit.TLE = function() {
    this.lines = new Array(null, null, null);

    this.is_valid = false;
    this.satellite_name = null;
    this.satellite_number = null;
    this.classification = null;
    this.international_designator = null;
    this.epoch_year = null;
    this.epoch_day = null;
    this.mean_motion_dot = null;
    this.mean_motion_dot_dot = null;
    this.bstar = null;
    this.ephemeris_type = null;
    this.element_number = null;
    this.inclination = null;
    this.right_ascension_ascending_node = null;
    this.eccentricity = null;
    this.argument_of_perigee = null;
    this.mean_anomaly = null;
    this.mean_motion = null;
    this.revolution_number = null;
    this.jd_epoch = null;
};

/**
 * Method to read a TLE into it's individual element values
 */
iOrbit.TLE.prototype.readTLE = function(element_set) {
    this.lines = element_set.split(/\r?\n|\r/);

    if ((this.lines.length == 2 || this.lines.length == 3) && this.validate_checksum()) {
        // Sets to TRUE when the TLE checksum has been validated
        this.is_valid = true;
    
        // Line one data elements
        this.satellite_number = this.get_satellite_number();
        this.classification = this.get_classification_level();
        this.international_designator = this.get_international_designator();
        this.epoch_year = this.get_epoch_year();
        this.epoch_day = this.get_epoch_day();
        this.mean_motion_dot = this.get_mean_motion_dot();
        this.mean_motion_dot_dot = this.get_mean_motion_dot_dot();
        this.bstar = this.get_bstar();
        this.ephemeris_type = this.get_ephemeris_type();
        this.element_number = this.get_element_number();

        // Line two data elements
        this.inclination = this.get_inclination();
        this.right_ascension_ascending_node = this.get_right_ascension_ascending_node();
        this.eccentricity = this.get_eccentricity();
        this.argument_of_perigee = this.get_argument_of_perigee();
        this.mean_anomaly = this.get_mean_anomaly();
        this.mean_motion = this.get_mean_motion();
        this.revolution_number = this.get_revolution_number();

        // Sets the satellite name to the NORAD number if only two lines exist in the TLE, otherwise uses line zero for the name
        this.lines.length == 2 ? this.satellite_name = this.satellite_number : this.satellite_name = String(this.lines[0].trim());
        
        // a = (this.mean_motion * iOrbit.TUMIN)^(-2/3)
        // alta = a * (1 + this.eccentricity) - 1
        // altb = a * (1 - this.eccentricity) - 1
        
        // Convert epoch year and epoch day to julian date        
        var epochDate = iOrbit.epochToDate(this.epoch_year, this.epoch_day);
        this.jd_epoch = iOrbit.jday(epochDate.year, epochDate.month, epochDate.day, epochDate.hour, epochDate.minute, epochDate.second);
    }
};

/**
 * Returns the satellite catalog number if the catalog number is the same on both line one and line two, else returns null.
 */
iOrbit.TLE.prototype.get_satellite_number = function() {
    if (this.lines[1].slice(2, 7).trim() == this.lines[2].slice(2, 7).trim()) {
        return String(this.lines[1].slice(2, 7).trim());
    } else {
        this.isValid = false;
        return null;
    }
};

/**
 * Returns the satellite classification level (U = Unclassified, S = Secret, T = Top Secret)
 */
iOrbit.TLE.prototype.get_classification_level = function() {
    return String(this.lines[1].slice(7,8).trim());
};

/**
 * Returns the international designator
 */
iOrbit.TLE.prototype.get_international_designator = function() {
    return String(this.get_launch_year() + this.get_launch_number() + this.get_launch_piece());
};

/**
 * Returns the satellite launch year
 */
iOrbit.TLE.prototype.get_launch_year = function() {
    return String(this.lines[1].slice(9,11).trim());
};

/**
 * Returns the satellite launch number
 */
iOrbit.TLE.prototype.get_launch_number = function() {
    return String(this.lines[1].slice(11,14).trim(), 10);
};

/**
 * Returns the satellite launch piece
 */
iOrbit.TLE.prototype.get_launch_piece = function() {
    return String(this.lines[1].slice(14,17).trim());
};

/**
 * Returns the epoch year
 */
iOrbit.TLE.prototype.get_epoch_year = function() {
    var epoch_year = parseInt(this.lines[1].slice(18,20).trim(), 10);

    if (epoch_year < 57) {
        epoch_year = epoch_year + 2000;
    } else {
        epoch_year = epoch_year + 1900;
    }

    return epoch_year;
};

/**
 * Returns the epoch day and fractional day
 */
iOrbit.TLE.prototype.get_epoch_day = function() {
    return parseFloat(this.lines[1].slice(20,32).trim());
};

/**
 * Returns the first time derivative of the mean motion
 */
iOrbit.TLE.prototype.get_mean_motion_dot = function() {
    return parseFloat(this.lines[1].slice(33,43).trim()) / (iOrbit.XPDOTP * iOrbit.MINS_PER_DAY);
};

/**
 * Returns the second time derivative of the mean motion
 */
iOrbit.TLE.prototype.get_mean_motion_dot_dot = function() {
    var sign = this.lines[1].slice(44,45).trim();
    var digits = parseInt(this.lines[1].slice(45,50).trim());
    var exponentSign = this.lines[1].slice(50,51).trim();
    var exponentDigit = parseInt(this.lines[1].slice(51,52).trim());

    var x = parseFloat(sign + '0.' + digits) * Math.pow(10, parseInt(exponentSign + exponentDigit));
    
    return x / (iOrbit.XPDOTP * iOrbit.MINS_PER_DAY * iOrbit.MINS_PER_DAY);
};

/**
 * Returns the BSTAR drag term
 */
iOrbit.TLE.prototype.get_bstar = function() {
    var sign = this.lines[1].slice(53,54).trim();
    var digits = parseInt(this.lines[1].slice(54,59).trim());
    var exponentSign = this.lines[1].slice(59,60).trim();
    var exponentDigit = parseInt(this.lines[1].slice(60,61).trim());

    var x = parseFloat(sign + '0.' + digits);

    return x * Math.pow(10, parseInt(exponentSign + exponentDigit));
};

/**
 * Returns the ephemeris type
 */
iOrbit.TLE.prototype.get_ephemeris_type = function () {
    return parseInt(this.lines[1].slice(62,63).trim(), 10);
};

/**
 * Returns the element number
 */
iOrbit.TLE.prototype.get_element_number = function() {
    return parseInt(this.lines[1].slice(64,68).trim(), 10);
};

/**
 * Returns the inclination
 */
iOrbit.TLE.prototype.get_inclination = function() {
    return parseFloat(this.lines[2].slice(8,16).trim()) * iOrbit.DEG2RAD;
};

/**
 * Returns the right ascension of the ascending node
 */
iOrbit.TLE.prototype.get_right_ascension_ascending_node = function() {
    return parseFloat(this.lines[2].slice(17,25).trim()) * iOrbit.DEG2RAD;
};

/**
 * Returns the eccentricity
 */
iOrbit.TLE.prototype.get_eccentricity = function() {
    return parseFloat('0.' + this.lines[2].slice(26,33).trim());
};

/**
 * Returns the argument of perigee
 */
iOrbit.TLE.prototype.get_argument_of_perigee = function() {
    return parseFloat(this.lines[2].slice(34,42).trim()) * iOrbit.DEG2RAD;
};

/**
 * Returns the mean anomaly
 */
iOrbit.TLE.prototype.get_mean_anomaly = function() {
    return parseFloat(this.lines[2].slice(43,51).trim()) * iOrbit.DEG2RAD;
};

/**
 * Returns the mean motion (revolutions per day)
 */
iOrbit.TLE.prototype.get_mean_motion = function() {
    return parseFloat(this.lines[2].slice(52,63).trim()) / iOrbit.XPDOTP;
};

/**
 * Returns the revolution number at epoch
 */
iOrbit.TLE.prototype.get_revolution_number = function() {
    return parseInt(this.lines[2].slice(63,68).trim(), 10);
};

/**
 * Validates the checksums of both line one and line two and returns true if valid, false otherwise.
 */
iOrbit.TLE.prototype.validate_checksum = function() {
  var checksum_one = 0;
  var checksum_two = 0;

  for (var i = 0; i < this.lines[1].length-1; i++) {
    var x = this.lines[1].charAt(i);
    if (x != ' ' && !isNaN(x)) {
      checksum_one = checksum_one + (x * 1);
    } else if (x == '-') {
      checksum_one = checksum_one + 1;
    }
  }

  checksum_one = checksum_one % 10;

  for (var i = 0; i < this.lines[2].length-1; i++) {
    var x = this.lines[2].charAt(i);
    if (x != ' ' && !isNaN(x)) {
      checksum_two = checksum_two + (x * 1);
    } else if (x == '-') {
      checksum_two = checksum_two + 1;
    }
  }

  checksum_two = checksum_two % 10;

  if (checksum_one == this.lines[1].slice(-1) &&
    checksum_two == this.lines[2].slice(-1)) {
    return true;
  } else {
    this.isValid = false;

    return false;
  }
};