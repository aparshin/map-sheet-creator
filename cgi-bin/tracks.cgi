#!/usr/bin/perl -wT

use strict;
use CGI ':standard';
use CGI::Carp qw ( fatalsToBrowser );

use File::Temp qw ( tempfile );
use JSON;
use Encode;
use IO::Uncompress::Unzip;

use Geo::GPX;
use LWP::Simple qw(!head);
# use constant TRACK_EXTENSIONS => {plt => 'ozi', gpx => 'gpx'}; # extension => type in gpsbabel


 
$CGI::POST_MAX = 1024*1024*5;

my $query = new CGI;
$query->charset('utf-8');

print $query->header;

my @trackURLs;

my $upload_filename = $query->param("upload_track");
if ($upload_filename)
{
    my $upload_filehandle = $query->upload("upload_track") or die "Can't upload file";
    
    my $tmpBuff;
    $tmpBuff .= $_ while <$upload_filehandle>;
    my $urls = processFile( $tmpBuff, $upload_filename );
    @trackURLs = (@trackURLs, @$urls);
}

if ($query->param("web_track"))
{
    # TODO: add zip support
    my $url = $query->param("web_track");
    if ($url)
    {
        if ($url =~ /\.gpx/)
        {
            push @trackURLs, $url;
        } 
        else 
        {
            my $content = get($url);
            if ($content)
            {
                my $processedURLs = processFile( $content, $url );
                @trackURLs = (@trackURLs, @$processedURLs);
            }
        }
    }    
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

sub processFile
{
    my ($tmpBuff, $upload_filename) = @_;
    
    my $scriptAbsPath = "http://" . $ENV{SERVER_NAME} . ($ENV{SCRIPT_NAME} =~ m|(.+)/[^/]+$|)[0];
    
    my @trackURLs;
    if ( $upload_filename =~ /\.zip/ )
    {
        my $parsedFilenames = processZIP( $tmpBuff );
        push @trackURLs, rel2absSimple($_, $scriptAbsPath) for @$parsedFilenames;
    }
    else
    {
        my $filename = convert2GPX($tmpBuff, $upload_filename);
        push @trackURLs, rel2absSimple($filename, $scriptAbsPath);
    }
    
    return \@trackURLs;
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
        if ($curFilename =~ /\.(gpx|plt)$/)
        {
            my $buffer;
            while ( !$z->eof() ) { $z->read( \$buffer ); };
            my $filename = convert2GPX( $buffer, $curFilename );
            push @res, $filename if $filename;
        }
        $z->nextStream();
    }
    return \@res;
}

sub convert2GPX
{
    my ($data, $name) = @_;
    
    my $outBuffer;
    if ($name =~ /\.plt$/)
    {
        my $sh;
        open $sh, '<', \$data;
        
        foreach (1..6) {<$sh>;};
        my @waypoints;
        
        while (<$sh>)
        {
            unless ( m|([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)| )
            {
                close $sh;
                return;
            }
            
            push @waypoints, {lat => $1, lon => $2};
        }
        close $sh;
        my $gpx = Geo::Gpx->new();
        $gpx->tracks([{name=>'Track', segments=>[{points=>\@waypoints}]}]);
        $outBuffer = $gpx->xml;
    }
    elsif ($name =~ /\.gpx$/)
    {
        $outBuffer = $data;
    }
    else { return; };
    
    my ($temp_fh, $filename) = tempfile( DIR =>"../tracks/", SUFFIX => '.gpx' );
    print $temp_fh $outBuffer;
    close $temp_fh;
    
    return $filename;
}