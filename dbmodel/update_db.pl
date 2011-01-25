#!/usr/bin/perl

# Usage: 
#   update_db.pl <dbname> <dbuser> <dbpass> <update_script>
#
# Update script format:
#   [[v0]]
#   <SQL_COMMAND>;
#   <SQL_COMMAND>;
#   ...
#   <SQL_COMMAND>;
#   [[v1]]
#   ...
# Script gets version of DB from column metadata.version and executes all the SQL commands 
# for corresponding section (one of commands should increase DB version). Than same operations 
# are repeated while exists section with current DB version.

use DBI;

my $updateScript;

open UPD, $ARGV[3];
$updateScript .= $_ while <UPD>;
close UPD;

my %updateScripts;

while ($updateScript =~ /\[\[(\d+)\]\](.*?)(?=\[\[|$)/gs)
{
    my $curScript  = $2;
    my $curVersion = $1;
    my @curScriptVector;
    
    push @curScriptVector, $1 while $curScript =~ /([^;]+(?=;))/gs;
    $updateScripts{$curVersion} = \@curScriptVector;
}

my $dbName = $ARGV[0];
my $dbUser = $ARGV[1];
my $dbPass = $ARGV[2];
my $dbh = DBI->connect("DBI:mysql:$dbName:localhost", $dbUser, $dbPass) or die $DBI::errstr;

while(1)
{
    my @curVersionArray = $dbh->selectrow_array('SELECT version FROM metadata');
    my $curVersion = $curVersionArray[0];
    
    last unless exists $updateScripts{$curVersion};
    
    print "Updating version $curVersion...\n";
    
    for (@{$updateScripts{$curVersion}})
    {
        print "Executing: $_\n";
        $dbh->do($_) or die $DBI::errstr 
    }
}

$dbh->disconnect();