<?php
include 'util.php';

$conn = ConnectMySQL();
if (!$conn) {
    die("Connection failed: " . $conn->connect_error);
} 

if(!array_key_exists("minDate",$_GET) || !array_key_exists("maxDate",$_GET)){
	$conn->close();
	return"[]";
}

$reqMinDate = $_GET["minDate"];
$reqMaxDate = $_GET["maxDate"];

$sql = "SELECT * FROM obs_2017 WHERE d>='$reqMinDate' AND d<='$reqMaxDate'";
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