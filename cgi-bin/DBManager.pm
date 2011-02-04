package DBManager;
# Contains all the operations with DB.
# Provides interface for relative operations.

# DB version: 2

use DBI;
use DBParams;

my $singleton_dbh;

sub dbh
{
    return $singleton_dbh if defined $singleton_dbh;
    
    $singleton_dbh = DBI->connect(DB_LOCATION, DB_NAME, DB_PASS) or die $DBI::errstr;
    $singleton_dbh->do('SET NAMES utf8');

    return $singleton_dbh;
}

# Usage: 
#   registerRequest(\%request_data)
# where $request_data is hash reference with the following fields:
#   {min,max}{x,y}, zoom, size{x,y}, {ne,nw,sw,se}_{lat,lon}
# return ID of request
# use eval() to handle errors
sub registerRequest
{
    my $p = $_[0];
    my $sth = dbh->prepare("INSERT INTO request (minx, maxx, miny, maxy, zoom, sizex, sizey, ".
                           "ne_lon, ne_lat, nw_lon, nw_lat, se_lon, se_lat, sw_lon, sw_lat, status, received_time) ".
                           "VALUES (?, ?, ?, ?, ?, ?, ?,   ?, ?, ?, ?, ?, ?, ?, ?,  ?, ?)") or die $DBI::errstr;
    $sth->execute( $p->{minx}, $p->{maxx}, $p->{miny}, $p->{maxy}, $p->{zoom}, $p->{sizex}, $p->{sizey}, 
                   $p->{ne_lon}, $p->{ne_lat}, $p->{nw_lon}, $p->{nw_lat}, 
                   $p->{se_lon}, $p->{se_lat}, $p->{sw_lon}, $p->{sw_lat}, 0, gmtime_db(time)) or die $DBI::errstr;
    
    
    my $id = dbh->last_insert_id(undef, undef, undef, undef) or die $DBI::errstr;
    return $id;
}

# sub changeRequestStatus
# {
    # my ($id, $status) = @_;
    # my $sth = dbh->do("UPDATE request SET status = $status WHERE id = $id");
# }

 sub setRequestDone
 {
    my $id = shift;
    my $sth = dbh->do("UPDATE request SET done_time = '". gmtime_db(time) ."' WHERE id = $id") or die $DBI::errstr;
 }

# Usage: 
#    addRequestLayers(\@layerNames)
# Order of names in @layerNames is important for rendering
# Returns nothing
# use eval() to handle errors
sub addRequestLayers
{
    my ($id, $layers) = @_;
    return unless scalar @$layers;
    my @orderIndex = 0..(scalar @$layers - 1);
    
    my $sth = dbh->prepare("INSERT INTO request_layer (idrequest, layer_order, layer_name) VALUES ($id, ?, ?)") or die $DBI::errstr;
    $sth->execute_array(undef, \@orderIndex, $layers) or die $DBI::errstr;
}

###############################################################################
# Usage: gmtime_db(time)
# Internal function to convert time to MySQL string.
sub gmtime_db
{
    ($sec, $min, $hour,$mday,$mon,$year,$wday,$yday,$isdst)=gmtime(shift);
    return sprintf ("%4d-%02d-%02d %02d:%02d:%02d\n", $year+1900,$mon+1,$mday,$hour,$min,$sec);    
}


sub DESTROY 
{
    $singleton_dbh->disconnect() if $singleton_dbh;
}

1;