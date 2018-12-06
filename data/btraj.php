<?php
include 'util.php';

$conn = ConnectMySQL();
if (!$conn) {
    die("Connection failed: " . $conn->connect_error);
} 

if(!array_key_exists("expMin",$_GET) || !array_key_exists("expMax",$_GET) || !array_key_exists("station",$_GET) ){
	$conn->close();
	return"[]";
}

$reqExpMin = $_GET["expMin"];
$reqExpMax = $_GET["expMax"];
$reqStation = $_GET["station"];

$sql = "SELECT * FROM btraj WHERE experiment_date>='$reqExpMin' AND experiment_date<='$reqExpMax' AND station_id='$reqStation' AND PMf>0";
$result = $conn->query($sql);

if(!$result){
	$conn->close();
	return"[]";
}

$dataArr = array();
while($row = $result->fetch_assoc()) {
    $dataArr[] = $row;
}
echo json_encode($dataArr);

$conn->close();
?>