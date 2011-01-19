#!/usr/bin/perl -wT

use strict;
use CGI ':standard';
use CGI::Carp qw ( fatalsToBrowser );

use File::Temp qw ( tempfile );
use JSON;
use Encode;
use IO::Uncompress::Unzip;
 
$CGI::POST_MAX = 1024*1024*5;

my $query = new CGI;
$query->charset('utf-8');

print $query->header;

my @trackURLs;

my $upload_filename = $query->param("upload_track");
if ($upload_filename)
{
    my $upload_filehandle = $query->upload("upload_track") or die "Can't upload file";
    my $scriptAbsPath = "http://" . $ENV{SERVER_NAME} . ($ENV{SCRIPT_NAME} =~ m|(.+)/[^/]+$|)[0];
    
    if ( $upload_filename =~ /\.zip/ )
    {
        my $tmpBuff;
        open TMPBUFF, '>', \$tmpBuff;
        print TMPBUFF while <$upload_filehandle>;
        close TMPBUFF;
        my $parsedFilenames = processZIP( $tmpBuff );
        push @trackURLs, rel2absSimple($_, $scriptAbsPath) for @$parsedFilenames;
    }
    else
    {
        # my $filename =  "$$" . "$^T" . ".gpx";
        # open $TMP_FILE, '>', "../tracks/" . $filename or die "$!";
        my ($TMP_FILE, $filename) = tempfile( DIR =>"../tracks/", SUFFIX => '.gpx');
        # open $TMP_FILE, '>', $filename;
        # $filename =~ s|\\|/|g;
        # print rel2absSimple($filename, $scriptAbsPath) . "--------";
        # binmode $TMP_FILE;
        print $TMP_FILE $_ while <$upload_filehandle>;
        close $TMP_FILE;
        
        push @trackURLs, rel2absSimple($filename, $scriptAbsPath);
    }
}

if ($query->param("web_track"))
{
    # TODO: add zip support
    my $url = $query->param("web_track");
    push @trackURLs, $url;
    qx{ gpsbabel };
}

print to_json(\@trackURLs);

sub rel2absSimple
{
    my ($rel, $base) = @_;
    
    $rel  =~ s|\\|/|g;
    $base =~ s|\\|/|g;
    
    while ($rel =~ m|^\.\./|)
    {
        $base =~ s|/[^/]+$||;
        $rel  =~ s|^\.\./||;
    }
    
    return $base . '/' . $rel;
}

sub processZIP
{
    my $fh = shift;
    my $z = new IO::Uncompress::Unzip (\$fh, Append => 1) or die "Can't create unzipper...";
    my @res;
    
    while ( !$z->eof() )
    {
        my $header = $z->getHeaderInfo();
        my $curFilename = decode('cp866', $header->{'Name'});
        if ($curFilename =~ /\.gpx$/)
        {
            my $buffer;
            while ( !$z->eof() ) { $z->read( \$buffer ); };
            my ($temp_fh, $filename) = tempfile( DIR =>"../tracks/", SUFFIX => '.gpx' );
            # $filename =~ s|\\|/|g;
            print $temp_fh $buffer;
            close $temp_fh;
            push @res, $filename;
        }
        $z->nextStream();
    }
    return \@res;
}