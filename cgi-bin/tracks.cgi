#!/usr/bin/perl -wT

use strict;
use CGI ':standard';
use CGI::Carp qw ( fatalsToBrowser ); 

my $query = new CGI;
$query->charset('utf-8');

print $query->header;
print "Retuned from [{}{\"\"}''] server";