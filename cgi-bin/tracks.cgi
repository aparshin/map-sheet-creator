#!/usr/bin/perl -wT

use strict;
use CGI ':standard';
use CGI::Carp qw ( fatalsToBrowser );
 
$CGI::POST_MAX = 1024*1024;

my $query = new CGI;
$query->charset('utf-8');

print $query->header;

my $trackURL;

if ($query->param("upload_track"))
{
    my $upload_filehandle = $query->upload("upload_track") or die "Can't upload file";
    
    my $filename =  "$$" . "$^T" . ".gpx";
    open TMP_FILE, '>', "../tracks/" . $filename or die "$!";
    
    binmode TMP_FILE;
    print TMP_FILE while <$upload_filehandle>;
    close TMP_FILE;
    
    my $scriptAbsPath = "http://" . $ENV{SERVER_NAME} . ($ENV{SCRIPT_NAME} =~ m|(.+)/[^/]+$|)[0];
    $trackURL = rel2absSimple("../tracks/" . $filename, $scriptAbsPath);    
}
else
{
    $trackURL = $query->param("web_track");
}

print $trackURL;

sub rel2absSimple
{
    my ($rel, $base) = @_;
    
    $rel  =~ s|\\|/|;
    $base =~ s|\\|/|;
    
    # my $separator = ($res =~ /\\/) ? '\\' : '/';
    
    while ($rel =~ m|^\.\./|)
    {
        $base =~ s|/[^/]+$||;
        $rel  =~ s|^\.\./||;
    }
    
    return $base . '/' . $rel;
}