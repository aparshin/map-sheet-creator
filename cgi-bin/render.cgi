#!/usr/bin/perl -wT

# Combines tiles into single picture and saves it to disk (as 8-bit PNG). Map file for OziExplorer is also constructed.
# Input parameters:
# * minx, miny, maxx, maxy - coordinates of area in composition (pixels)
# * zoom level, which should be used for compining (for example, 13, 14, ...)
# * lenx, leny - phisical length of composed picture after printing (centimeters). Used to set dpi
# * ne, nw, se, sw - 2-element arrays of corners coordinates (lat, lon)
#
# Output:
# JSON with following fields:
#  * pic_filename - local name of generated picture (no folder or hostname, for example: sheet_0.png)
#  * map_filename - local name of generated map file
#  *[optional] debug - Any debug information
#
# In case of any errors, the only field 'error' with error description will be passed using JSON.
#
# Files (both picture and map) will be generated in folder '../sheets'
# Supports, that maps are in folders '../../maps/slazav/' and '../../maps/arbalet/'

use lib '.';

use strict;
use CGI ':standard';
use CGI::Carp qw ( fatalsToBrowser ); 
use Image::Magick;
use JSON;
use POSIX;

use DBManager;
use Logger;

use constant TILE_SIZE     => 256;
use constant TILE_FOLDERS  => {slazav => '../../maps/slazav/', arbalet => '../../maps/arbalet/'};
use constant TARGET_FOLDER => '../sheets'; # Folder, where rendered sheets and map files will be rendered.
use constant MAX_PIXELS => 12000000; # Maximum number of pixels in the rendered picture.

my $logger = new Logger();
# We are going to print error as JSON and exit each time we get error
# Add corresponding callback to logger
$logger->addErrorCallback(sub{
    print to_json( {error => $_[0]} ); 
    exit();
});

my $query = new CGI;
$query->charset('utf-8');
print $query->header;

my $minx = $query->param('minx');
my $maxx = $query->param('maxx');
my $miny = $query->param('miny');
my $maxy = $query->param('maxy');
my $zoom = $query->param('zoom');
my $lenx = $query->param('lenx');
my $leny = $query->param('leny');

$logger->error( 'minx is greater than or equal to maxx') if $minx >= $maxx;
$logger->error( 'miny is greater than or equal to maxy') if $miny >= $maxy;
$logger->error( 'zoom is less than zero') if $zoom < 0;

my @maps = split( ",", $query->param('map_layout') );

$logger->error('Map layers are not defined') unless scalar @maps;

my $w = $maxx - $minx +1;
my $h = $maxy - $miny +1;

if ($w*$h > MAX_PIXELS)
{
    # printErrorJSON($logger, 'Map sheet is too big. It contains '.($w*$h).' pixels. Maximum number of pixels is '.MAX_PIXELS); 
    $logger->error('Map sheet is too big. It contains '.($w*$h).' pixels. Maximum number of pixels is '.MAX_PIXELS); 
    exit;
}

my @nePoint = $query->param('ne[]');
my @nwPoint = $query->param('nw[]');
my @sePoint = $query->param('se[]');
my @swPoint = $query->param('sw[]');

my $requestID = DBManager::registerRequest({
                                 minx => $minx, maxx=> $maxx, 
                                 miny => $miny, maxy=> $maxy, 
                                 zoom => $zoom, 
                                 sizex => $lenx, sizey => $leny, 
                                 ne_lon => $nePoint[1], ne_lat => $nePoint[0],
                                 nw_lon => $nwPoint[1], nw_lat => $nwPoint[0],
                                 se_lon => $sePoint[1], se_lat => $sePoint[0],
                                 sw_lon => $swPoint[1], sw_lat => $swPoint[0]
                               });

$logger->log("Request ID: $requestID");
                               
DBManager::addRequestLayers( $requestID, \@maps );
# my $miny = 324*256+210;
# my $maxy = 325*256+130;
# my $minx = 618*256+107;
# my $maxx = 621*256+150;
# my $zoom = 10;

my $tileminx = int($minx/TILE_SIZE);
my $tilemaxx = int(($maxx+1)/TILE_SIZE);
my $tileminy = int($miny/TILE_SIZE);
my $tilemaxy = int(($maxy+1)/TILE_SIZE);

my $globalShiftX = $minx % TILE_SIZE;
my $globalShiftY = $miny % TILE_SIZE;

my $size = "${w}x${h}";
my $density =  ceil($w/$lenx) . "x" . ceil($h/$leny);

my $image = new Image::Magick(size => $size, type => 'PaletteMatte', units => 'PixelsPerCentimeter', transparent => 'transparent', density => $density, colors => 255);
$image->ReadImage('xc:transparent');

for my $x ($tileminx..$tilemaxx)
{
    for my $y ($tileminy..$tilemaxy)
    {
        for my $curMapname (@maps)
        {
            my $tileFilename = getTileFilename( $curMapname, $x, $y, $zoom );
            next unless -e $tileFilename;
            
            my $curImage = new Image::Magick; 
            my $res;
            $res = $curImage->Read($tileFilename);
            die "$res" if "$res";

            my $xstart = $minx - $x*TILE_SIZE;
            my $ystart = $miny - $y*TILE_SIZE;
            my $xstop  = $maxx - $x*TILE_SIZE;
            my $ystop  = $maxy - $y*TILE_SIZE;
            
            $xstart = 0 if $xstart < 0;
            $ystart = 0 if $ystart < 0;
            $xstop = 255 if $xstop > 255;
            $ystop = 255 if $ystop > 255;
            
            if ( $xstart > 0 || $ystart > 0 || $xstop < 255 || $ystop < 255 )
            {
                $curImage->Crop( x => $xstart, y => $ystart, width => $xstop - $xstart + 1, height => $ystop - $ystart + 1);
            }
            
            $res = $image->Composite( image => $curImage, 
                                      x => ($x-$tileminx)*TILE_SIZE + $xstart - $globalShiftX, 
                                      y => ($y-$tileminy)*TILE_SIZE + $ystart - $globalShiftY );
            die "$res" if "$res";
            # last;
            # TODO: optimize composing, check number of transparent pixels!
        }
    }
}

# my $prefix = 0;
# while ( -e TARGET_FOLDER."/sheet_${prefix}.png" ) {$prefix++;};
my $prefix = $requestID;
my $filename = "sheet_${prefix}.png";
my $res = $image->Write("png8:".TARGET_FOLDER."/$filename");

# We skip any warnings here. When working under WinXP, there are many warnings with PNG8 format.
# Looks like some of them are bugs in IM: http://www.wizards-toolkit.org/discourse-server/viewtopic.php?f=3&t=16490
die "$res" if "$res" =~ /error/;

(my $mapFilename = $filename) =~ s/\.png$/.map/;
my $MAPFILE;
open $MAPFILE, ">:crlf", TARGET_FOLDER."/$mapFilename";
printMapFile(\@nwPoint, \@nePoint, \@sePoint, \@swPoint, $filename, $w, $h, int($w/$lenx), $MAPFILE);
close $MAPFILE;

# $logger->log('Test server log');

my $outResult;
$outResult->{map_filename} = "sheet_${prefix}.map";
$outResult->{pic_filename} = "sheet_${prefix}.png";
$outResult->{debug} = $logger->getLogs;
print to_json( $outResult );

sub isValidMapname
{
    return exists TILE_FOLDERS->{$_[0]};
}

sub getTileFilename
{
    my ($mapname, $x, $y, $z) = @_;
    return TILE_FOLDERS->{$mapname} . "Z${z}/${y}_${x}.png";
}

sub printCalibrationPointToMapfile
{
    my ($pointPostfix, $x, $y, $lat, $lng) = @_;
    my $degMinutes = sub{ return sprintf("%.6f", ($_[0] - int($_[0]))*60); };
    
    return "Point${pointPostfix},xy, $x, $y,in, deg, " . 
            int($lat) . ", " . &$degMinutes($lat) . ",N, " . int($lng) . ", " . &$degMinutes($lng) . ",E, grid, , , ,S";
}

sub printMapFile
{
    my ($nw, $ne, $se, $sw, $filename, $w, $h, $scale, $hbuffer) = @_;
    
    print $hbuffer "OziExplorer Map Data File Version 2.2\n";
    print $hbuffer "Rendered map\n";
    print $hbuffer "$filename\n";
    print $hbuffer "1 ,Map Code,\n";
    print $hbuffer "WGS 84,WGS 84, 0.0000, 0.0000,WGS 84\n";
    print $hbuffer "Reserved 1\n";
    print $hbuffer "Reserved 2\n";
    print $hbuffer "Magnetic Variation,,,E\n";
    print $hbuffer "Map Projection,Mercator,PolyCal,No,AutoCalOnly,No,BSBUseWPX,No\n";
    print $hbuffer printCalibrationPointToMapfile("01", 0,    0,    $nw->[0], $nw->[1]) . "\n";
    print $hbuffer printCalibrationPointToMapfile("02", $w-1, 0,    $ne->[0], $ne->[1]) . "\n";
    print $hbuffer printCalibrationPointToMapfile("03", 0,    $h-1, $sw->[0], $sw->[1]) . "\n";
    print $hbuffer printCalibrationPointToMapfile("04", $w-1, $h-1, $se->[0], $se->[1]) . "\n";
    print $hbuffer "Point".sprintf("%02d", $_).",xy, , ,in, deg, , ,S, , ,E, grid, , , ,S\n" for (5..30);
    print $hbuffer "Projection Setup,,,,,,,,,,\n";
    print $hbuffer "Map Feature = MF ; Map Comment = MC These follow if they exist\n";
    print $hbuffer "Moving Map Parameters = MM? These follow if they exist\n";
    print $hbuffer "MM0,Yes\n";
    print $hbuffer "MMPNUM,4\n";
    print $hbuffer "MMPXY,1,0,0\n";
    print $hbuffer "MMPXY,2,".($w-1).",0\n";
    print $hbuffer "MMPXY,3,0,".($h-1)."\n";
    print $hbuffer "MMPXY,4,".($w-1).",".($h-1)."\n";
    print $hbuffer "MMPLL,1, ".$nw->[0].", ".$nw->[1]."\n";
    print $hbuffer "MMPLL,2, ".$ne->[0].", ".$ne->[1]."\n";
    print $hbuffer "MMPLL,3, ".$sw->[0].", ".$sw->[1]."\n";
    print $hbuffer "MMPLL,4, ".$se->[0].", ".$se->[1]."\n";
    print $hbuffer "MM1B,$scale";
}

# Synopsis: printErrorJSON( logger, errorMessage )
# Prepares JSON string with error description.
# sub printErrorJSON
# {
    # print to_json( {error => $_[0]} );
# }